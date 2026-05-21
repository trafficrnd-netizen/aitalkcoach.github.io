'use server'

import { createClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis'
import type { Database } from '@/types/database'
import { isInstitutionalEmail, INSTITUTIONAL_EMAIL_ERROR, isPersonalEmail } from '@/lib/email-validation'

type ResearcherProfileInsert = Database['public']['Tables']['researcher_profiles']['Insert']
type SupplierProfileInsert = Database['public']['Tables']['supplier_profiles']['Insert']

async function checkPhoneVerified(phone: string): Promise<boolean> {
  const flag = await redis.get<string>(`otp:verified:${phone}`)
  return flag === 'ok'
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  if (!data.user) return { error: '로그인에 실패했습니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplierProfile } = await (supabase as any)
    .from('supplier_profiles')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()

  return { destination: supplierProfile ? '/supplier/board' : '/researcher/board' }
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

  if (!phone) return { error: '휴대폰 본인인증을 완료해주세요.' }

  const verified = await checkPhoneVerified(phone)
  if (!verified) return { error: '휴대폰 인증이 만료되었습니다. 다시 인증해주세요.' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, user_type: 'researcher' },
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

  const profileData: ResearcherProfileInsert = {
    user_id: data.user.id,
    name,
    institution: institution || null,
    department: department || null,
    phone,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase as any).from('researcher_profiles').insert(profileData)

  if (profileError) {
    console.error('[signup] researcher_profiles insert 실패:', profileError.message)
  }

  // Consume the verified flag so it can't be reused
  await redis.del(`otp:verified:${phone}`)
}

export async function signupSupplier(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 완전히 알 수 없는 도메인(빈 도메인 등)은 차단, 개인 이메일은 서류 심사 트랙으로 허용
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return { error: '올바른 이메일 주소를 입력해주세요.' }

  // 연구자용 기관 이메일 에러 메시지는 공급자에게 노출하지 않음
  void INSTITUTIONAL_EMAIL_ERROR

  const verificationStatus: string = isPersonalEmail(email) ? 'pending' : 'instant'

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

  if (!contactPhone) return { error: '담당자 휴대폰 본인인증을 완료해주세요.' }

  const verified = await checkPhoneVerified(contactPhone)
  if (!verified) return { error: '휴대폰 인증이 만료되었습니다. 다시 인증해주세요.' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: companyName, user_type: 'supplier' },
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
    contact_phone: contactPhone,
    verification_status: verificationStatus,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase as any)
    .from('supplier_profiles')
    .insert(profileData)

  if (profileError) {
    if (profileError.message.includes('unique') && profileError.message.includes('contact_phone')) {
      return { error: '이미 가입된 담당자 휴대폰 번호입니다.' }
    }
    console.error('[signup] supplier_profiles insert 실패:', profileError.message)
  }

  // Consume the verified flag
  await redis.del(`otp:verified:${contactPhone}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
