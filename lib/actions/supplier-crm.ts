'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CrmCustomer {
  researcherId: string
  name: string
  institution: string | null
  followedAt: string
  viaCode: string | null
  dealCount: number
}

export interface CrmCoupon {
  id: string
  title: string
  discountType: 'percent' | 'amount'
  discountValue: number
  minOrder: number
  target: 'all_followers' | 'specific'
  targetResearcherId: string | null
  validUntil: string | null
  maxUses: number | null
  usedCount: number
  active: boolean
  createdAt: string
}

/** 공급자의 유치 고객(팔로워) 목록 */
export async function getSupplierCustomers(): Promise<CrmCustomer[] | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).rpc('supplier_customers', { p_supplier_id: user.id })
  return (data ?? []).map((r: {
    researcher_id: string; name: string; institution: string | null; followed_at: string; via_code: string | null; deal_count: number
  }) => ({
    researcherId: r.researcher_id, name: r.name, institution: r.institution,
    followedAt: r.followed_at, viaCode: r.via_code, dealCount: r.deal_count,
  }))
}

/** 공급자가 발행한 쿠폰 목록 */
export async function getSupplierCoupons(): Promise<CrmCoupon[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('supplier_coupons').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false })
  return (data ?? []).map(mapCoupon)
}

/** 쿠폰 발행 */
export async function issueCoupon(input: {
  title: string
  discountType: 'percent' | 'amount'
  discountValue: number
  minOrder?: number
  target: 'all_followers' | 'specific'
  targetResearcherId?: string | null
  validUntil?: string | null
  maxUses?: number | null
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }
  if (!input.title?.trim() || !input.discountValue || input.discountValue <= 0) {
    return { ok: false, error: '제목과 할인값을 입력해주세요.' }
  }
  if (input.discountType === 'percent' && input.discountValue > 100) {
    return { ok: false, error: '할인율은 100%를 넘을 수 없습니다.' }
  }
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('supplier_coupons').insert({
    supplier_id: user.id,
    title: input.title.trim(),
    discount_type: input.discountType,
    discount_value: input.discountValue,
    min_order: input.minOrder ?? 0,
    target: input.target,
    target_researcher_id: input.target === 'specific' ? (input.targetResearcherId ?? null) : null,
    valid_until: input.validUntil || null,
    max_uses: input.maxUses ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** 쿠폰 활성/비활성 토글 */
export async function toggleCoupon(couponId: string, active: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('supplier_coupons').update({ active }).eq('id', couponId).eq('supplier_id', user.id)
  return { ok: true }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCoupon(c: any): CrmCoupon {
  return {
    id: c.id, title: c.title, discountType: c.discount_type, discountValue: c.discount_value,
    minOrder: c.min_order ?? 0, target: c.target, targetResearcherId: c.target_researcher_id,
    validUntil: c.valid_until, maxUses: c.max_uses, usedCount: c.used_count, active: c.active, createdAt: c.created_at,
  }
}
