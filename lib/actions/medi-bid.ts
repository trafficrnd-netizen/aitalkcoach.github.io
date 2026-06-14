'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isFree } from '@/lib/verticals'

const VERTICAL = 'aesthetic' as const

// ─────────────────────────────────────────────────────────────────────────────
// 에스테틱 공급사 입찰 — 토큰/크레딧 차감 없음, 무제한 무료
// ─────────────────────────────────────────────────────────────────────────────
export async function createMediBid(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const requestId   = formData.get('requestId') as string
  const totalPrice  = Number(formData.get('totalPrice'))
  const deliveryDate = (formData.get('deliveryDate') as string) || null
  const memo        = (formData.get('memo') as string) || null

  if (!requestId) return { error: '요청 ID가 없습니다.' }
  if (!totalPrice || totalPrice <= 0) return { error: '견적 금액을 입력해주세요.' }

  // isFree 가드 — aesthetic은 항상 통과
  void isFree(VERTICAL)

  // 공급사 프로필 확인 (medi-supplier는 supplier_profiles에 verticals=['aesthetic'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplier } = await (supabase as any)
    .from('supplier_profiles')
    .select('company_name, verticals')
    .eq('user_id', user.id)
    .single()
  if (!supplier) return { error: '공급사 계정이 필요합니다.' }

  // 요청 조회 — aesthetic vertical + open 상태만
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('id, user_id, title, status, vertical')
    .eq('id', requestId)
    .eq('status', 'open')
    .eq('vertical', VERTICAL)
    .single()
  if (!request) return { error: '요청을 찾을 수 없거나 이미 마감되었습니다.' }

  // 자기 요청 입찰 방지
  if (request.user_id === user.id) return { error: '본인이 등록한 요청에는 입찰할 수 없습니다.' }

  // 중복 입찰 방지
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', requestId)
    .eq('supplier_id', user.id)
  if (Number(count) > 0) return { error: '이미 이 요청에 입찰하셨습니다.' }

  // 입찰 삽입 (vertical 컬럼 포함)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid, error: bidErr } = await (supabase as any)
    .from('bids')
    .insert({
      request_id: requestId,
      supplier_id: user.id,
      is_partial: false,
      delivery_date: deliveryDate,
      memo,
      vertical: VERTICAL,
    })
    .select('id')
    .single()
  if (bidErr || !bid) return { error: '입찰 처리 중 오류가 발생했습니다.' }

  // request_items 연결
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reqItems } = await (supabase as any)
    .from('request_items')
    .select('id')
    .eq('request_id', requestId)

  if (reqItems?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bid_items').insert(
      (reqItems as Array<{ id: string }>).map((item) => ({
        bid_id: bid.id,
        request_item_id: item.id,
        total_price: totalPrice,
        available: true,
      }))
    )
  }

  redirect('/medi-supplier/bids')
}

// ─────────────────────────────────────────────────────────────────────────────
// 내 입찰 목록 (medi-supplier)
// ─────────────────────────────────────────────────────────────────────────────
export async function getMyMediBids() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('bids')
    .select('id, created_at, delivery_date, memo, vertical, request_id, requests(id, title, deadline, delivery_city, status, vertical)')
    .eq('supplier_id', user.id)
    .eq('vertical', VERTICAL)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// aesthetic 마켓플레이스 요청 목록 (공급사용)
// ─────────────────────────────────────────────────────────────────────────────
export async function getMediMarketplaceRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { requests: [], myBidSet: new Set<string>() }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requests } = await (supabase as any)
    .from('requests')
    .select('id, title, deadline, delivery_city, notes, created_at, item_type, status')
    .eq('status', 'open')
    .eq('vertical', VERTICAL)
    .order('created_at', { ascending: false })
    .limit(60)

  // 내 입찰 현황
  const reqIds: string[] = (requests ?? []).map((r: { id: string }) => r.id)
  const myBidSet = new Set<string>()
  if (reqIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: myBids } = await (supabase as any)
      .from('bids')
      .select('request_id')
      .eq('supplier_id', user.id)
      .in('request_id', reqIds)
    for (const b of (myBids ?? [])) myBidSet.add(b.request_id)
  }

  return { requests: requests ?? [], myBidSet }
}
