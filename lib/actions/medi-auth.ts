'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redis } from '@/lib/redis'
import { isInstitutionalEmail, INSTITUTIONAL_EMAIL_ERROR } from '@/lib/email-validation'
import { isFree } from '@/lib/verticals'

const VERTICAL = 'aesthetic' as const

async function checkPhoneVerified(phone: string): Promise<boolean> {
  const flag = await redis.get(`otp:verified:${phone}`)
  return flag != null
}

// ─────────────────────────────────────────────────────────────────────────────
// 의원(Clinic) 가입
// ─────────────────────────────────────────────────────────────────────────────
export async function signupClinic(formData: FormData) {
  const supabase = await createClient()

  const email      = formData.get('email') as string
  const password   = formData.get('password') as string

  if (!isInstitutionalEmail(email)) return { error: INSTITUTIONAL_EMAIL_ERROR }

  const clinicName    = (formData.get('clinicName') as string) || ''
  const businessNumber = (formData.get('businessNumber') as string).replace(/-/g, '')
  const representative = (formData.get('representative') as string) || null
  const address        = (formData.get('address') as string) || null
  const phone          = (formData.get('phone') as string) || null
  const contactName    = (formData.get('contactName') as string) || null
  const contactPhone   = (formData.get('contactPhone') as string) || ''

  if (!clinicName) return { error: '의원명을 입력해주세요.' }
  if (!businessNumber) return { error: '사업자등록번호를 입력해주세요.' }
  if (!contactPhone) return { error: '담당자 휴대폰 인증을 완료해주세요.' }

  const verified = await checkPhoneVerified(contactPhone)
  if (!verified) return { error: '휴대폰 인증이 만료되었습니다. 다시 인증해주세요.' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: clinicName, user_type: 'clinic' },
      emailRedirectTo: 'https://ai-traffic.kr/auth/callback',
    },
  })

  if (error) {
    if (error.message.includes('already registered')) return { error: '이미 가입된 이메일입니다.' }
    return { error: '가입 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }
  if (!data.user) return { error: '가입 중 오류가 발생했습니다.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin as any).from('clinic_profiles').insert({
    user_id: data.user.id,
    clinic_name: clinicName,
    business_number: businessNumber,
    representative,
    address,
    phone,
    contact_name: contactName,
    contact_phone: contactPhone || null,
    vertical: VERTICAL,
  })

  if (profileError) {
    if (profileError.message.includes('unique') && profileError.message.includes('contact_phone')) {
      return { error: '이미 가입된 담당자 휴대폰 번호입니다.' }
    }
    console.error('[medi] clinic_profiles insert 실패:', profileError.message)
  }

  await redis.del(`otp:verified:${contactPhone}`)
  return { emailPending: true, email }
}

// ─────────────────────────────────────────────────────────────────────────────
// 에스테틱 공급사 가입
// ─────────────────────────────────────────────────────────────────────────────
export async function signupMediSupplier(formData: FormData) {
  const supabase = await createClient()

  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  if (!isInstitutionalEmail(email)) return { error: INSTITUTIONAL_EMAIL_ERROR }

  const companyName    = (formData.get('companyName') as string) || ''
  const businessNumber = (formData.get('businessNumber') as string).replace(/-/g, '')
  const representative = (formData.get('representative') as string) || null
  const address        = (formData.get('address') as string) || null
  const phone          = (formData.get('phone') as string) || null
  const contactName    = (formData.get('contactName') as string) || null
  const contactPhone   = (formData.get('contactPhone') as string) || ''

  if (!companyName) return { error: '회사명을 입력해주세요.' }
  if (!businessNumber) return { error: '사업자등록번호를 입력해주세요.' }
  if (!contactPhone) return { error: '담당자 휴대폰 인증을 완료해주세요.' }

  const verified = await checkPhoneVerified(contactPhone)
  if (!verified) return { error: '휴대폰 인증이 만료되었습니다. 다시 인증해주세요.' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: companyName, user_type: 'supplier' },
      emailRedirectTo: 'https://ai-traffic.kr/auth/callback',
    },
  })

  if (error) {
    if (error.message.includes('already registered')) return { error: '이미 가입된 이메일입니다.' }
    return { error: '가입 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }
  if (!data.user) return { error: '가입 중 오류가 발생했습니다.' }

  const admin = createAdminClient()

  // ── isFree 가드: aesthetic은 크레딧/구독 게이팅 스킵 → early_bird=true ──
  const freeFields = isFree(VERTICAL)
    ? { plan: 'free', credits: 99999, early_bird: true }
    : {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin as any).from('supplier_profiles').insert({
    user_id: data.user.id,
    company_name: companyName,
    business_number: businessNumber,
    representative,
    address,
    phone,
    categories: [],
    handles_hazmat: false,
    contact_name: contactName,
    contact_phone: contactPhone || null,
    origin: 'domestic',
    verticals: [VERTICAL],
    ...freeFields,
  })

  if (profileError) {
    if (profileError.message.includes('unique') && profileError.message.includes('contact_phone')) {
      return { error: '이미 가입된 담당자 휴대폰 번호입니다.' }
    }
    if (profileError.message.includes('unique') && profileError.message.includes('business_number')) {
      return { error: '이미 가입된 사업자등록번호입니다.' }
    }
    console.error('[medi] supplier_profiles insert 실패:', profileError.message)
  }

  // ── med_device 서류 업로드 → supplier_certifications ──────────────────────
  const certFiles: Array<{ key: string; certType: string }> = [
    { key: 'cert_med_device', certType: 'med_device' },
    { key: 'cert_biz_reg',    certType: 'business'   },
  ]

  for (const { key, certType } of certFiles) {
    const file = formData.get(key)
    if (!(file instanceof File) || file.size === 0) continue

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const filePath = `${data.user.id}/${certType}.${ext}`
    const bytes = await file.arrayBuffer()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: uploadData, error: uploadError } = await (admin as any)
      .storage
      .from('medi-certs')
      .upload(filePath, bytes, { contentType: file.type || 'application/pdf', upsert: true })

    if (uploadError) {
      console.error(`[medi] cert 업로드 실패 [${certType}]:`, uploadError.message)
      continue
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { publicUrl } } = (admin as any).storage
      .from('medi-certs')
      .getPublicUrl(filePath)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('supplier_certifications').upsert({
      supplier_id: data.user.id,
      vertical: VERTICAL,
      cert_type: certType,
      doc_url: publicUrl,
      status: 'pending',
    }, { onConflict: 'supplier_id,vertical,cert_type' })

    void uploadData
  }

  await redis.del(`otp:verified:${contactPhone}`)
  return { emailPending: true, email }
}
