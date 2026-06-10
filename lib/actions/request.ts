'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { BatchItem } from '@/components/batch-item-row'

export async function createSingleRequest(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: '로그인이 필요합니다.' }
  }

  const substanceName = formData.get('substanceName') as string
  const casNumber = (formData.get('casNumber') as string) || null
  const qty = Number(formData.get('qty'))
  const unit = (formData.get('unit') as string) || null
  const purity = (formData.get('purity') as string) || null
  const volume = (formData.get('volume') as string) || null
  const deadline = (formData.get('deadline') as string) || null
  const deliveryAddress = (formData.get('deliveryAddress') as string) || null
  const notes = (formData.get('notes') as string) || null
  const bidMode = (formData.get('bidMode') as string) || 'open'
  const itemType = (formData.get('itemType') as string) || 'reagent'
  const itemSubType = (formData.get('itemSubType') as string) || null
  const itemSpecsRaw = (formData.get('itemSpecs') as string) || null
  const itemSpecs = itemSpecsRaw ? JSON.parse(itemSpecsRaw) : null
  const supplierCode = (formData.get('supplierCode') as string)?.trim().toUpperCase() || null
  const couponId = (formData.get('couponId') as string) || null
  const deliveryCity = (formData.get('deliveryCity') as string)?.trim() || null
  const paymentTerms = (formData.get('paymentTerms') as string) || null

  if (!substanceName || !qty || qty <= 0) {
    return { error: '물질명과 수량은 필수입니다.' }
  }
  if (!deliveryCity) {
    return { error: '배송 도시명은 필수입니다.' }
  }

  // 공급자 전용 코드 라우팅 — preferred_supplier_id 해석
  let preferredSupplierId: string | null = null
  let viaSupplierCode: string | null = null
  if (supplierCode) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sp } = await (supabase as any)
      .from('supplier_profiles')
      .select('user_id, referral_code_active')
      .eq('referral_code', supplierCode)
      .maybeSingle()
    if (sp?.user_id && sp.referral_code_active) {
      preferredSupplierId = sp.user_id
      viaSupplierCode = supplierCode
    }
  }

  // requests 테이블에 삽입
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request, error: reqError } = await (supabase as any)
    .from('requests')
    .insert({
      researcher_id: user.id,
      type: 'single',
      title: substanceName,
      deadline,
      delivery_address: deliveryAddress,
      notes,
      bid_mode: bidMode,
      item_type: itemType,
      item_sub_type: itemSubType,
      item_specs: itemSpecs,
      preferred_supplier_id: preferredSupplierId,
      via_supplier_code: viaSupplierCode,
      delivery_city: deliveryCity,
      payment_terms: paymentTerms,
    })
    .select('id')
    .single()

  if (reqError || !request) {
    return { error: '요청 생성 중 오류가 발생했습니다.' }
  }

  // request_items 테이블에 품목 삽입
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemError } = await (supabase as any)
    .from('request_items')
    .insert({
      request_id: request.id,
      substance_name: substanceName,
      cas_number: casNumber,
      qty,
      unit,
      purity,
      volume,
    })

  if (itemError) {
    return { error: '품목 저장 중 오류가 발생했습니다.' }
  }

  // 쿠폰 적용 기록 (직접/동시 라우팅 + 쿠폰 선택 시)
  if (couponId && preferredSupplierId) {
    await recordCouponRedemption(couponId, user.id, request.id)
  }

  redirect(`/researcher/requests`)
}

/** 쿠폰 사용 기록 + used_count 증가 (검증 포함, 비치명적) */
async function recordCouponRedemption(couponId: string, researcherId: string, requestId: string) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any
    // 쿠폰 유효성 재확인 (활성·한도·기간)
    const { data: c } = await db.from('supplier_coupons').select('*').eq('id', couponId).maybeSingle()
    if (!c || !c.active) return
    if (c.max_uses != null && c.used_count >= c.max_uses) return
    if (c.valid_until && new Date(c.valid_until) < new Date()) return

    await db.from('coupon_redemptions').insert({
      coupon_id: couponId, researcher_id: researcherId, request_id: requestId,
    })
    await db.from('supplier_coupons').update({ used_count: (c.used_count ?? 0) + 1 }).eq('id', couponId)
  } catch (e) {
    console.error('[recordCouponRedemption] 실패:', e)
  }
}

export async function createBatchRequest(
  items: BatchItem[],
  meta: { title: string; deadline: string; deliveryAddress: string; notes: string; deliveryCity?: string; paymentTerms?: string },
  bidMode: string = 'open'
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: '로그인이 필요합니다.' }

  const validItems = items.filter(i => i.substanceName.trim() && Number(i.qty) > 0)
  if (validItems.length < 2) return { error: '묶음 요청은 품목이 2개 이상이어야 합니다.' }
  if (!meta.deliveryCity?.trim()) return { error: '배송 도시명은 필수입니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request, error: reqError } = await (supabase as any)
    .from('requests')
    .insert({
      researcher_id: user.id,
      type: 'batch',
      title: meta.title || `묶음 요청 ${validItems.length}개 품목`,
      deadline: meta.deadline || null,
      delivery_address: meta.deliveryAddress || null,
      notes: meta.notes || null,
      bid_mode: bidMode,
      delivery_city: meta.deliveryCity.trim(),
      payment_terms: meta.paymentTerms || null,
    })
    .select('id')
    .single()

  if (reqError || !request) return { error: '요청 생성 중 오류가 발생했습니다.' }

  const itemRows = validItems.map(i => ({
    request_id: request.id,
    substance_name: i.substanceName,
    cas_number: i.casNumber || null,
    qty: Number(i.qty),
    unit: i.unit || null,
    purity: i.purity || null,
    volume: i.volume || null,
    note: i.note || null,
    item_type: i.itemType || 'reagent',
    item_sub_type: i.itemSubType || null,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemError } = await (supabase as any).from('request_items').insert(itemRows)
  if (itemError) return { error: '품목 저장 중 오류가 발생했습니다.' }

  redirect('/researcher/requests')
}

export async function cancelRequest(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('researcher_id', user.id)
    .eq('status', 'open')

  redirect('/researcher/requests')
}
