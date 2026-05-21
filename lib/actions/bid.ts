'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resend, FROM_EMAIL } from '@/lib/resend'

export type BidItemInput = {
  requestItemId: string
  totalPrice: number
  available: boolean
}

export async function submitSingleBid(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const requestId    = formData.get('requestId') as string
  const totalPrice   = Number(formData.get('totalPrice'))
  const deliveryDate = (formData.get('deliveryDate') as string) || null
  const memo         = (formData.get('memo') as string) || null

  if (!totalPrice || totalPrice <= 0) return { error: '견적 금액을 입력해주세요.' }

  // ── supplier 조회 · request 검증 · 중복 체크 · 품목 목록 — 4개 병렬 ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [supplierRes, requestRes, countRes, itemsRes] = await Promise.all([
    (supabase as any).from('supplier_profiles').select('company_name').eq('user_id', user.id).single(),
    (supabase as any).from('requests').select('id, researcher_id, title, status').eq('id', requestId).eq('status', 'open').single(),
    (supabase as any).from('bids').select('*', { count: 'exact', head: true }).eq('request_id', requestId).eq('supplier_id', user.id),
    (supabase as any).from('request_items').select('id').eq('request_id', requestId),
  ])

  if (!supplierRes.data)            return { error: '공급자 계정이 필요합니다.' }
  if (!requestRes.data)             return { error: '요청을 찾을 수 없거나 이미 마감되었습니다.' }
  if (Number(countRes.count) > 0)   return { error: '이미 이 요청에 입찰하셨습니다.' }

  const supplier = supplierRes.data
  const request  = requestRes.data
  const reqItems = itemsRes.data as Array<{ id: string }> | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid, error: bidErr } = await (supabase as any)
    .from('bids')
    .insert({ request_id: requestId, supplier_id: user.id, is_partial: false, delivery_date: deliveryDate, memo })
    .select('id')
    .single()
  if (bidErr || !bid) return { error: '입찰 처리 중 오류가 발생했습니다.' }

  if (reqItems?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bid_items').insert(
      reqItems.map(item => ({
        bid_id: bid.id,
        request_item_id: item.id,
        total_price: totalPrice,
        available: true,
      }))
    )
  }

  notifyNewBid(request.researcher_id, request.title, supplier.company_name).catch(console.error)

  redirect('/supplier/bids')
}

export async function submitBatchBid(
  requestId: string,
  items: BidItemInput[],
  meta: { deliveryDate: string; memo: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const available = items.filter(i => i.available)
  if (!available.length)                                     return { error: '최소 1개 품목을 선택해야 합니다.' }
  if (available.some(i => !i.totalPrice || i.totalPrice <= 0)) return { error: '선택한 품목의 가격을 모두 입력해주세요.' }

  // ── supplier · request · 중복 — 3개 병렬 ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [supplierRes, requestRes, countRes] = await Promise.all([
    (supabase as any).from('supplier_profiles').select('company_name').eq('user_id', user.id).single(),
    (supabase as any).from('requests').select('id, researcher_id, title, status').eq('id', requestId).eq('status', 'open').single(),
    (supabase as any).from('bids').select('*', { count: 'exact', head: true }).eq('request_id', requestId).eq('supplier_id', user.id),
  ])

  if (!supplierRes.data)           return { error: '공급자 계정이 필요합니다.' }
  if (!requestRes.data)            return { error: '요청을 찾을 수 없거나 이미 마감되었습니다.' }
  if (Number(countRes.count) > 0)  return { error: '이미 이 요청에 입찰하셨습니다.' }

  const supplier  = supplierRes.data
  const request   = requestRes.data
  const isPartial = available.length < items.length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid, error: bidErr } = await (supabase as any)
    .from('bids')
    .insert({
      request_id:    requestId,
      supplier_id:   user.id,
      is_partial:    isPartial,
      delivery_date: meta.deliveryDate || null,
      memo:          meta.memo || null,
    })
    .select('id')
    .single()
  if (bidErr || !bid) return { error: '입찰 처리 중 오류가 발생했습니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('bid_items').insert(
    items.map(item => ({
      bid_id:           bid.id,
      request_item_id:  item.requestItemId,
      total_price:      item.available ? item.totalPrice : null,
      available:        item.available,
    }))
  )

  notifyNewBid(request.researcher_id, request.title, supplier.company_name).catch(console.error)

  redirect('/supplier/bids')
}

async function notifyNewBid(researcherId: string, requestTitle: string, supplierName: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usr } = await (supabase as any).from('users').select('email').eq('id', researcherId).single()
  if (!usr?.email) return

  await resend.emails.send({
    from:    FROM_EMAIL,
    to:      usr.email,
    subject: `[BidVibe] 새 견적이 도착했습니다 — "${requestTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#6d28d9;margin-bottom:8px;">새 견적이 도착했습니다</h2>
        <p><strong>${supplierName}</strong>이(가) <strong>"${requestTitle}"</strong>에 견적을 제출했습니다.</p>
        <p style="color:#6b7280;">마감일까지 입찰을 더 받을 수 있습니다. BidVibe에서 확인하세요.</p>
        <a href="https://bidvibe.kr/researcher/requests" style="display:inline-block;background:#6d28d9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">내 요청 확인하기 →</a>
      </div>
    `,
  })
}
