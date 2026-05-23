'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { awardCredits } from '@/lib/credits'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function acceptBid(bidId: string, requestId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('id, researcher_id, title, status')
    .eq('id', requestId)
    .eq('researcher_id', user.id)
    .single()
  if (!request || request.status !== 'open') redirect(`/researcher/requests/${requestId}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid } = await (supabase as any)
    .from('bids')
    .select('id, supplier_id')
    .eq('id', bidId)
    .eq('request_id', requestId)
    .single()
  if (!bid) redirect(`/researcher/requests/${requestId}`)

  // 자전거래 방지 — 본인이 제출한 입찰은 낙찰할 수 없음 (방어적 검증)
  if (bid.supplier_id === user.id) redirect(`/researcher/requests/${requestId}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('bids').update({ status: 'accepted' }).eq('id', bidId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('bids')
    .update({ status: 'rejected' })
    .eq('request_id', requestId)
    .neq('id', bidId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('requests').update({ status: 'closed' }).eq('id', requestId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('transactions')
    .insert({ request_id: requestId, bid_id: bidId, status: 'in_progress' })

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

  // 크레딧 적립: 거래 완료 (연구자 + 공급자)
  try {
    await awardCredits(user.id, 'researcher_transaction_complete', 'researcher', 'transactions', transactionId)
    if (bid?.supplier_id) {
      await awardCredits(bid.supplier_id, 'supplier_transaction_complete', 'supplier', 'transactions', transactionId)
    }
  } catch (e) {
    console.error('[completeTransaction] 크레딧 적립 실패:', e)
  }

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

  // C: 연구결과 good/bad
  const outcomeRaw = formData.get('research_outcome') as string | null
  const researchOutcome = outcomeRaw === 'good' ? true : outcomeRaw === 'bad' ? false : null

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
    research_outcome: researchOutcome,
  })

  // C: 연구결과를 제출한 연구자에게 크레딧 적립 (good/bad 모두 해당)
  if (researchOutcome !== null && reviewerRole === 'researcher') {
    try {
      await awardCredits(user.id, 'researcher_review_outcome', 'researcher', 'reviews', transactionId)
    } catch (e) {
      console.error('[submitReview] 크레딧 적립 실패:', e)
    }
  }

  // 공급자: 평점 4점 이상 받으면 크레딧 적립 (★★★★+)
  if (score >= 4 && revieweeId && reviewerRole === 'researcher') {
    try {
      await awardCredits(revieweeId, 'supplier_high_rating', 'supplier', 'reviews', transactionId)
    } catch (e) {
      console.error('[submitReview] supplier_high_rating 적립 실패:', e)
    }
  }

  redirect(backUrl)
}

async function notifyBidAccepted(supplierId: string, requestTitle: string) {
  // 가입 이메일 발송
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usr } = await (admin as any).auth.admin.getUserById(supplierId)
  const supplierEmail = usr?.user?.email
  if (!supplierEmail) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('supplier_profiles').select('company_name').eq('user_id', supplierId).single()

  await resend.emails.send({
    from: FROM_EMAIL,
    to: supplierEmail,
    subject: `[ai-traffic.kr] 🎉 낙찰 알림 — "${requestTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1E2F52;margin-bottom:8px;">🎉 낙찰되었습니다!</h2>
        <p>${profile?.company_name ?? '공급자'}님의 견적이 채택되었습니다.</p>
        <p><strong>"${requestTitle}"</strong> 요청에 대한 납품을 진행해주세요.</p>
        <p style="color:#6b7280;">납품 완료 후 연구자가 거래 완료를 신고하면 거래가 종료됩니다.</p>
        <a href="https://ai-traffic.kr/supplier/bids" style="display:inline-block;background:#F4A261;color:#1A2236;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;font-weight:600;">내 입찰 확인하기 →</a>
      </div>
    `,
  })
}
