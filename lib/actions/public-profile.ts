'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface PublicSupplierProfile {
  companyName: string
  country: string | null
  origin: string
  categories: string[]
  tier: string | null
  verified: boolean
  reviewCount: number
  reviewAvg: number
  catalog: { substance_name: string; transactions_count: number; avg_unit_price: number | null; last_unit: string | null }[]
  code: string
  referralCodeActive: boolean
}

/** 공개 프로필 조회 — 조건(인증+티어+옵트인) 충족 시에만 반환 */
export async function getPublicSupplierProfile(code: string): Promise<PublicSupplierProfile | { error: string }> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).rpc('public_supplier_profile', { p_code: code })
  if (!data?.ok) return { error: data?.reason ?? 'not_found' }
  return {
    companyName: data.company_name,
    country: data.country ?? null,
    origin: data.origin ?? 'domestic',
    categories: data.categories ?? [],
    tier: data.tier ?? null,
    verified: !!data.verified,
    reviewCount: data.review_count ?? 0,
    reviewAvg: Number(data.review_avg ?? 0),
    catalog: data.catalog ?? [],
    code: data.code,
    referralCodeActive: !!data.referral_code_active,
  }
}

/** 공급자 본인의 공개 프로필 노출 토글 */
export async function setPublicProfileEnabled(enabled: boolean): Promise<{ ok: boolean }> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('supplier_profiles').update({ public_profile_enabled: enabled }).eq('user_id', user.id)
  return { ok: true }
}
