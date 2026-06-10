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
  // Upstash Redis auto-parses JSON on retrieval, so '1' stored as string
  // may come back as number 1. Check for existence (non-null) instead of exact value.
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

  // user_metadata.user_type 기준으로 라우팅 (DB 프로필 존재 여부와 무관하게 정확히 동작)
  const userType = data.user.user_metadata?.user_type
  return { destination: userType === 'supplier' ? '/supplier/board' : '/researcher/board' }
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

  // admin client 사용: RLS 우회 + public.users 트리거 실행 후 바로 insert 가능
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

  // 초대 코드 처리 — 초대자에게 크레딧 적립 (실패해도 가입은 정상 완료)
  if (referralCode) {
    try {
      await processReferralSignup(referralCode, data.user.id, email)
    } catch (e) {
      console.error('[signup] 초대 처리 실패:', e)
    }
  }

  // Consume the verified flag so it can't be reused
  await redis.del(`otp:verified:${phone}`)

  return { emailPending: true, email }
}

export async function signupSupplier(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!isInstitutionalEmail(email)) return { error: INSTITUTIONAL_EMAIL_ERROR }

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
  const overseasSupplyType = (formData.get('overseasSupplyType') as string) || null  // 'chemical' | 'equipment'
  const country = (formData.get('country') as string) || null
  const orType = (formData.get('orType') as string) || null
  const orCompanyName = (formData.get('orCompanyName') as string) || null
  const orBusinessNumber = ((formData.get('orBusinessNumber') as string) || '').replace(/-/g, '') || null
  const equipmentHasChemicals = formData.get('equipmentHasChemicals') === 'true'
  const kcCertAcknowledged = formData.get('kcCertAcknowledged') === 'true'

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

  // admin client 사용: RLS 우회 + public.users 트리거 실행 후 바로 insert 가능
  const admin = createAdminClient()

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
  // 해외 공급자 필드 추가 (타입 정의에 없을 수 있으므로 별도 병합)
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
    .insert({ ...profileData, ...overseasFields })

  if (profileError) {
    if (profileError.message.includes('unique') && profileError.message.includes('contact_phone')) {
      return { error: '이미 가입된 담당자 휴대폰 번호입니다.' }
    }
    console.error('[signup] supplier_profiles insert 실패:', profileError.message)
  }

  // 초대 코드 처리 — 초대자에게 크레딧 적립 (실패해도 가입은 정상 완료)
  if (referralCode) {
    try {
      await processReferralSignup(referralCode, data.user.id, email)
    } catch (e) {
      console.error('[signup] 초대 처리 실패:', e)
    }
  }

  // Consume the verified flag (국내 OTP만)
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
