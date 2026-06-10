'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AvailableCoupon {
  couponId: string
  supplierId: string
  companyName: string
  title: string
  discountType: 'percent' | 'amount'
  discountValue: number
  minOrder: number
  validUntil: string | null
}

/** 연구자가 사용 가능한 쿠폰 (팔로우한 공급자 발행분) */
export async function getMyAvailableCoupons(): Promise<AvailableCoupon[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).rpc('coupons_for_researcher', { p_researcher_id: user.id })
  return (data ?? []).map((r: {
    coupon_id: string; supplier_id: string; company_name: string; title: string;
    discount_type: 'percent' | 'amount'; discount_value: number; min_order: number; valid_until: string | null
  }) => ({
    couponId: r.coupon_id, supplierId: r.supplier_id, companyName: r.company_name,
    title: r.title, discountType: r.discount_type, discountValue: r.discount_value,
    minOrder: r.min_order, validUntil: r.valid_until,
  }))
}

/** 연구자가 팔로우한 공급자 목록 (견적 작성 시 직접 지정용) */
export async function getMyFollowedSuppliers(): Promise<{ supplierId: string; companyName: string; code: string | null }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data: follows } = await db.from('supplier_followers').select('supplier_id').eq('researcher_id', user.id)
  const ids = (follows ?? []).map((f: { supplier_id: string }) => f.supplier_id)
  if (ids.length === 0) return []
  const { data: profiles } = await db.from('supplier_profiles').select('user_id, company_name, referral_code').in('user_id', ids)
  return (profiles ?? []).map((p: { user_id: string; company_name: string; referral_code: string | null }) => ({
    supplierId: p.user_id, companyName: p.company_name, code: p.referral_code,
  }))
}
