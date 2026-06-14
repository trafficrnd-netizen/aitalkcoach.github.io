'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const VERTICAL = 'aesthetic' as const

// ─────────────────────────────────────────────────────────────────────────────
// 에스테틱 입찰 수락 — 크레딧/토큰 차감 없음 (isFree guard)
// ─────────────────────────────────────────────────────────────────────────────
export async function acceptMediBid(bidId: string, requestId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 요청 소유자 확인 + aesthetic + open 상태
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('id, researcher_id, title, status, vertical')
    .eq('id', requestId)
    .eq('researcher_id', user.id)
    .eq('vertical', VERTICAL)
    .single()
  if (!request || request.status !== 'open') redirect(`/clinic/requests/${requestId}`)

  // 입찰 존재 확인
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid } = await (supabase as any)
    .from('bids')
    .select('id, supplier_id')
    .eq('id', bidId)
    .eq('request_id', requestId)
    .single()
  if (!bid) redirect(`/clinic/requests/${requestId}`)

  // 자전거래 방지
  if (bid.supplier_id === user.id) redirect(`/clinic/requests/${requestId}`)

  // 수락 처리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('bids')
    .update({ status: 'accepted' })
    .eq('id', bidId)

  // 나머지 입찰 rejected
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('bids')
    .update({ status: 'rejected' })
    .eq('request_id', requestId)
    .neq('id', bidId)

  // 요청 closed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('requests')
    .update({ status: 'closed' })
    .eq('id', requestId)

  redirect(`/clinic/requests/${requestId}`)
}
