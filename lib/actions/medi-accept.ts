'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { resend, FROM_EMAIL } from '@/lib/resend'

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

  // 공급사에게 수락 알림 (fire-and-forget)
  notifyMediBidAccepted(bid.supplier_id, request.title).catch(console.error)

  redirect(`/clinic/requests/${requestId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 공급사 알림: 입찰 수락됨
// ─────────────────────────────────────────────────────────────────────────────
async function notifyMediBidAccepted(supplierUserId: string, requestTitle: string) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user: supplier } } = await (admin as any).auth.admin.getUserById(supplierUserId)
  const email: string | undefined = supplier?.email
  if (!email) return

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `[BidVibe Medi] 견적이 수락되었습니다 — "${requestTitle}"`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#1A2236;">
        <h2 style="color:#1E2F52;margin-bottom:8px;">🎉 견적이 수락되었습니다!</h2>
        <p style="font-size:14px;"><strong>"${requestTitle}"</strong>에 제출하신 견적이 의원에게 선택되었습니다.</p>
        <p style="color:#6b7280;font-size:13px;">의원 측에서 별도로 연락드릴 예정입니다. 신속히 납품 준비를 시작해 주세요.</p>
        <a href="https://ai-traffic.kr/medi-supplier/bids"
           style="display:inline-block;background:#14b8a6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
          내 입찰 확인하기 →
        </a>
        <p style="font-size:11px;color:#9ca3af;margin-top:20px;">
          BidVibe Medi · 에스테틱 의료기기 소모품 견적 플랫폼 (ai-traffic.kr)
        </p>
      </div>
    `,
  })
}
