'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AdSearchResult {
  id: string
  title: string
  description: string | null
  categories: string[]
  products: string[]
  regions: string[]
  contactInfo: string | null
  supplierId: string
  verified: boolean
}

/**
 * 에스테틱 공급사 광고(디렉터리) 검색.
 * 카테고리 + 키워드(제목·설명·제품)로 유효 광고를 찾고, med_device 인증 공급사에 배지를 단다.
 */
export async function searchAestheticAds(params: {
  category?: string
  keyword?: string
}): Promise<AdSearchResult[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let q = (supabase as any)
    .from('supplier_ads')
    .select('id, supplier_id, title, description, categories, products, regions, contact_info, valid_until')
    .eq('vertical', 'aesthetic')
    .gte('valid_until', today)
    .order('valid_until', { ascending: false })
    .limit(60)

  if (params.category) q = q.contains('categories', [params.category])
  if (params.keyword && params.keyword.trim()) q = q.ilike('search_text', `%${params.keyword.trim()}%`)

  const { data, error } = await q
  if (error || !data) return []

  // med_device 인증(verified) 공급사 집합 → 배지
  const supplierIds = [...new Set(data.map((d: any) => d.supplier_id))]
  let verifiedSet = new Set<string>()
  if (supplierIds.length > 0) {
    const admin = createAdminClient()
    const { data: certs } = await (admin as any)
      .from('supplier_certifications')
      .select('supplier_id')
      .eq('vertical', 'aesthetic')
      .eq('cert_type', 'med_device')
      .eq('status', 'verified')
      .in('supplier_id', supplierIds)
    verifiedSet = new Set((certs ?? []).map((c: any) => c.supplier_id))
  }

  return data.map((d: any) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    categories: d.categories ?? [],
    products: d.products ?? [],
    regions: d.regions ?? [],
    contactInfo: d.contact_info,
    supplierId: d.supplier_id,
    verified: verifiedSet.has(d.supplier_id),
  }))
}

/** 리드 추적 — 광고 노출/전화클릭/요청클릭 기록 (마케팅 리포트·재유입용) */
export async function logAdEvent(
  adId: string,
  eventType: 'view' | 'contact_click' | 'request_click',
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await (supabase as any)
      .from('ad_events')
      .insert({ ad_id: adId, viewer_id: user?.id ?? null, event_type: eventType })
  } catch {
    /* 추적 실패는 무시 */
  }
}
