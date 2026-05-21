'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resend, FROM_EMAIL } from '@/lib/resend'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function acceptBid(bidId: string, requestId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── request 검증 · bid 검증 — 2개 병렬 ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requestRes, bidRes] = await Promise.all([
    (supabase as any).from('requests').select('id, researcher_id, title, status').eq('id', requestId).eq('researcher_id', user.id).single(),
    (supabase as any).from('bids').select('id, supplier_id').eq('id', bidId).eq('request_id', requestId).single(),
  ])

  const request = requestRes.data
  const bid     = bidRes.data
  if (!request || request.status !== 'open') redirect(`/researcher/requests/${requestId}`)
  if (!bid) redirect(`/researcher/requests/${requestId}`)

  // ── accept · reject others · close request · create transaction — 4개 병렬 ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await Promise.all([
    (supabase as any).from('bids').update({ status: 'accepted' }).eq('id', bidId),
    (supabase as any).from('bids').update({ status: 'rejected' }).eq('request_id', requestId).neq('id', bidId),
    (supabase as any).from('requests').update({ status: 'closed' }).eq('id', requestId),
    (supabase as any).from('transactions').insert({ request_id: requestId, bid_id: bidId, status: 'in_progress' }),
  ])

  notifyBidAccepted(bid.supplier_id, request.title).catch(console.error)

  redirect(`/researcher/requests/${requestId}`)
}

export async function completeTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const transactionId = formData.get('transactionId') as string
  const actualDelivery = (formData.get('actualDelivery') as string) || null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tx } = await (supabase as any)
    .from('transactions')
    .select('id, request_id, bid_id, status')
    .eq('id', transactionId)
    .single()
  if (!tx || tx.status !== 'in_progress') redirect('/researcher/requests')

  // Verify researcher owns request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from('requests')
    .select('researcher_id')
    .eq('id', tx.request_id)
    .eq('researcher_id', user.id)
    .single()
  if (!req) redirect('/researcher/requests')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid } = await (supabase as any)
    .from('bids')
    .select('supplier_id')
    .eq('id', tx.bid_id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('transactions')
    .update({
      status: 'completed',
      actual_delivery: actualDelivery,
      completed_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  redirect(`/researcher/transactions/${transactionId}/review?reviewee=${bid?.supplier_id ?? ''}`)
}

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const transactionId = formData.get('transactionId') as string
  const revieweeId = formData.get('revieweeId') as string
  const reviewerRole = (formData.get('reviewerRole') as string) || 'researcher'
  const score = Number(formData.get('score'))
  const priceScore = Number(formData.get('price_score')) || null
  const deliveryScore = Number(formData.get('delivery_score')) || null
  const communicationScore = Number(formData.get('communication_score')) || null
  const comment = (formData.get('comment') as string) || null

  const backUrl = reviewerRole === 'supplier' ? '/supplier/bids' : '/researcher/requests'

  if (!score || score < 1 || score > 5) redirect(backUrl)
  if (!revieweeId) redirect(backUrl)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('transaction_id', transactionId)
    .eq('reviewer_id', user.id)
  if (Number(count) > 0) redirect(backUrl)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('reviews').insert({
    transaction_id: transactionId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    reviewer_role: reviewerRole,
    score,
    price_score: priceScore,
    delivery_score: deliveryScore,
    communication_score: communicationScore,
    comment,
  })

  redirect(backUrl)
}

async function notifyBidAccepted(supplierId: string, requestTitle: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usr } = await (supabase as any).from('users').select('email').eq('id', supplierId).single()
  if (!usr?.email) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('supplier_profiles').select('company_name').eq('user_id', supplierId).single()

  await resend.emails.send({
    from: FROM_EMAIL,
    to: usr.email,
    subject: `[BidVibe] 🎉 낙찰 알림 — "${requestTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#6d28d9;margin-bottom:8px;">🎉 낙찰되었습니다!</h2>
        <p>${profile?.company_name ?? '공급자'}님의 견적이 채택되었습니다.</p>
        <p><strong>"${requestTitle}"</strong> 요청에 대한 납품을 진행해주세요.</p>
        <p style="color:#6b7280;">납품 완료 후 연구자가 거래 완료를 신고하면 거래가 종료됩니다.</p>
        <a href="https://bidvibe.kr/supplier/bids" style="display:inline-block;background:#6d28d9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">내 입찰 확인하기 →</a>
      </div>
    `,
  })
}
