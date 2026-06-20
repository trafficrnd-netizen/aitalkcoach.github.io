'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redis } from '@/lib/redis'
import type { Database } from '@/types/database'
import { isInstitutionalEmail, INSTITUTIONAL_EMAIL_ERROR } from '@/lib/email-validation'
import { processReferralSignup } from '@/lib/referral'

type ResearcherProfileInsert = Database['public']['Tables']['researcher_profiles']['Insert']
type SupplierProfileInsert = Database['public']['Tables']['supplier_profiles']['Insert']

async function checkPhoneVerified(phone: string): Promise<boolean> {
  const flag = await redis.get(`otp:verified:${phone}`)
  return flag != null
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message === 'Email not confirmed') {
      return {
        error: '이메일 인증이 필요합니다. 가입 시 발송된 인증 이메일의 링크를 클릭한 후 다시 로그인해주세요.',
        emailNotConfirmed: true,
      }
    }
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  if (!data.user) return { error: '로그인에 실패했습니다.' }

  const userType = data.user.user_metadata?.user_type as string | undefined

  if (userType === 'clinic') {
    return { destination: '/clinic' }
  }
  if (userType === 'supplier') {
    // aesthetic vertical 여부 확인
    const supabase2 = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sp } = await (supabase2 as any)
      .from('supplier_profiles')
      .select('verticals')
      .eq('user_id', data.user.id)
      .maybeSingle()
    const isAesthetic = (sp?.verticals as string[] | null)?.includes('aesthetic')
    return { destination: isAesthetic ? '/medi-supplier' : '/supplier/board' }
  }
  return { destination: '/researcher/board' }
}

export async function signupResearcher(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!isInstitutionalEmail(email)) return { error: INSTITUTIONAL_EMAIL_ERROR }

  const name = formData.get('name') as string
  const institution = formData.get('institution') as string
  const department = (formData.get('department') as string) || null
  const phone = (formData.get('phone') as string) || ''
  const referralCode = ((formData.get('referralCode') as string) || '').trim()

  if (!phone) return { error: '휴대폰 본인인증을 완료해주세요.' }

  const verified = await checkPhoneVerified(phone)
  if (!verified) return { error: '휴대폰 인증이 만료되었습니다. 다시 인증해주세요.' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, user_type: 'researcher' },
      emailRedirectTo: 'https://ai-traffic.kr/auth/callback',
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: '이미 가입된 이메일입니다.' }
    }
    return { error: '가입 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  if (!data.user) {
    return { error: '가입 중 오류가 발생했습니다.' }
  }

  const admin = createAdminClient()

  const profileData: ResearcherProfileInsert = {
    user_id: data.user.id,
    name,
    institution: institution || null,
    department: department || null,
    phone,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin as any).from('researcher_profiles').insert(profileData)

  if (profileError) {
    console.error('[signup] researcher_profiles insert 실패:', profileError.message)
  }

  if (referralCode) {
    try {
      await processReferralSignup(referralCode, data.user.id, email, 'researcher')
    } catch (e) {
      console.error('[signup] 초대 처리 실패:', e)
    }
  }

  await redis.del(`otp:verified:${phone}`)

  return { emailPending: true, email }
}

export async function signupSupplier(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const companyName = formData.get('companyName') as string
  const businessNumber = (formData.get('businessNumber') as string).replace(/-/g, '')
  const representative = (formData.get('representative') as string) || null
  const address = (formData.get('address') as string) || null
  const phone = (formData.get('phone') as string) || null
  const contactName = (formData.get('contactName') as string) || null
  const contactPhone = (formData.get('contactPhone') as string) || ''
  const categories = formData.getAll('categories') as string[]
  const handlesHazmat = formData.get('handlesHazmat') === 'true'
  const hazmatLicenseNo = (formData.get('hazmatLicenseNo') as string) || null
  const referralCode = ((formData.get('referralCode') as string) || '').trim()

  // 국내/해외 구분 + 해외 전용 필드
  const origin = (formData.get('origin') as string) === 'overseas' ? 'overseas' : 'domestic'
  const overseasSupplyType = (formData.get('overseasSupplyType') as string) || null
  const country = (formData.get('country') as string) || null
  const orType = (formData.get('orType') as string) || null
  const orCompanyName = (formData.get('orCompanyName') as string) || null
  const orBusinessNumber = ((formData.get('orBusinessNumber') as string) || '').replace(/-/g, '') || null
  const equipmentHasChemicals = formData.get('equipmentHasChemicals') === 'true'
  const kcCertAcknowledged = formData.get('kcCertAcknowledged') === 'true'

  // 국가별 규제 준수 (Task 37)
  const countryCode = (formData.get('country_code') as string) || (origin === 'domestic' ? 'KR' : null)
  let regulationAcks: Record<string, boolean> = {}
  let regulationPermitNumbers: Record<string, string> = {}
  try {
    const acksStr = formData.get('regulation_acks') as string
    if (acksStr) regulationAcks = JSON.parse(acksStr)
    const permitStr = formData.get('regulation_permit_numbers') as string
    if (permitStr) regulationPermitNumbers = JSON.parse(permitStr)
  } catch { /* ignore parse errors */ }

  // 전화 인증: 국내는 한국 SMS OTP 필수, 해외는 일반 연락처 허용
  if (origin === 'domestic') {
    if (!contactPhone) return { error: '담당자 휴대폰 본인인증을 완료해주세요.' }
    const verified = await checkPhoneVerified(contactPhone)
    if (!verified) return { error: '휴대폰 인증이 만료되었습니다. 다시 인증해주세요.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: companyName, user_type: 'supplier' },
      emailRedirectTo: 'https://ai-traffic.kr/auth/callback',
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: '이미 가입된 이메일입니다.' }
    }
    return { error: '가입 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  if (!data.user) {
    return { error: '가입 중 오류가 발생했습니다.' }
  }

  const admin = createAdminClient()

  // 규제 서류 파일 업로드 → supplier-permits/{userId}/{regId}.ext
  const regulationFileUrls: Record<string, string> = {}
  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith('permit_file_') && value instanceof File && value.size > 0) {
      const regId = key.slice('permit_file_'.length)
      const ext = value.name.split('.').pop()?.toLowerCase() || 'pdf'
      const filePath = `${data.user.id}/${regId}.${ext}`
      const bytes = await value.arrayBuffer()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: uploadData, error: uploadError } = await (admin as any)
        .storage
        .from('supplier-permits')
        .upload(filePath, bytes, { contentType: value.type || 'application/pdf', upsert: true })
      if (!uploadError && uploadData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { publicUrl } } = (admin as any).storage
          .from('supplier-permits')
          .getPublicUrl(filePath)
        regulationFileUrls[`${regId}_file`] = publicUrl
      } else if (uploadError) {
        console.error(`[signup] 규제서류 업로드 실패 [${regId}]:`, uploadError.message)
      }
    }
  }
  // 파일 URL을 regulation_permit_numbers에 병합 (키: {regId}_file)
  regulationPermitNumbers = { ...regulationPermitNumbers, ...regulationFileUrls }

  const profileData: SupplierProfileInsert = {
    user_id: data.user.id,
    company_name: companyName,
    business_number: businessNumber,
    representative,
    address,
    phone,
    categories: categories.length > 0 ? categories : [],
    handles_hazmat: handlesHazmat,
    hazmat_license_no: hazmatLicenseNo,
    contact_name: contactName,
    contact_phone: contactPhone || null,
  }

  const overseasFields = origin === 'overseas'
    ? {
        origin,
        overseas_supply_type: overseasSupplyType,
        country,
        or_type: orType,
        or_company_name: orCompanyName,
        or_business_number: orBusinessNumber,
        equipment_has_chemicals: equipmentHasChemicals,
        kc_cert_acknowledged: kcCertAcknowledged,
      }
    : { origin }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin as any)
    .from('supplier_profiles')
    .insert({
      ...profileData,
      ...overseasFields,
      country_code: countryCode,
      regulation_acks: regulationAcks,
      regulation_permit_numbers: regulationPermitNumbers,
    })

  if (profileError) {
    if (profileError.message.includes('unique') && profileError.message.includes('contact_phone')) {
      return { error: '이미 가입된 담당자 휴대폰 번호입니다.' }
    }
    console.error('[signup] supplier_profiles insert 실패:', profileError.message)
  }

  if (referralCode) {
    try {
      await processReferralSignup(referralCode, data.user.id, email, 'supplier')
    } catch (e) {
      console.error('[signup] 초대 처리 실패:', e)
    }
  }

  if (origin === 'domestic' && contactPhone) {
    await redis.del(`otp:verified:${contactPhone}`)
  }

  return { emailPending: true, email }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('researcher_profiles').delete().eq('user_id', user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('supplier_profiles').delete().eq('user_id', user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('users').delete().eq('id', user.id)

  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('[deleteAccount] auth.admin.deleteUser 실패:', authError.message)
    return { error: '계정 삭제 중 오류가 발생했습니다.' }
  }

  await supabase.auth.signOut()
  return { success: true }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { ok: false, error: '로그인이 필요합니다.' }
  if (newPassword.length < 8) return { ok: false, error: '새 비밀번호는 8자 이상이어야 합니다.' }

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInErr) return { ok: false, error: '현재 비밀번호가 올바르지 않습니다.' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
