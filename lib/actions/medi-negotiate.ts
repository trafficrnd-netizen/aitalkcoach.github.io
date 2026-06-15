'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { resend, FROM_EMAIL } from '@/lib/resend'

const VERTICAL = 'aesthetic'
const NEGOTIATION_HOURS = 12

// ─────────────────────────────────────────────────────────────────────────────
// 의원 → 흥정 제안 생성
// ─────────────────────────────────────────────────────────────────────────────
export async function createNegotiation(formData: FormData) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const bidId         = (formData.get('bidId') as string)?.trim()
  const requestId     = (formData.get('requestId') as string)?.trim()
  const competitorUrl = (formData.get('competitorUrl') as string)?.trim() || null
  const priceRaw      = formData.get('competitorPrice') as string
  const message       = (formData.get('message') as string)?.trim() || null

  if (!bidId || !requestId) return { error: '잘못된 요청입니다.' }
  if (!competitorUrl && !message) return { error: '경쟁사 링크 또는 메시지를 입력해주세요.' }

  const competitorPrice = priceRaw ? parseInt(priceRaw.replace(/,/g, ''), 10) : null

  // 요청 소유자 + allow_negotiation 확인
  const { data: request } = await db
    .from('requests')
    .select('id, researcher_id, title, allow_negotiation, status')
    .eq('id', requestId)
    .eq('researcher_id', user.id)
    .eq('vertical', VERTICAL)
    .single()

  if (!request) return { error: '요청을 찾을 수 없습니다.' }
  if (!request.allow_negotiation) return { error: '이 요청은 흥정이 허용되지 않습니다.' }
  if (request.status !== 'closed') return { error: '수락된 입찰이 없습니다.' }

  // 수락된 입찰 확인
  const { data: bid } = await db
    .from('bids')
    .select('id, supplier_id, created_at, status')
    .eq('id', bidId)
    .eq('request_id', requestId)
    .eq('status', 'accepted')
    .single()

  if (!bid) return { error: '수락된 입찰을 찾을 수 없습니다.' }

  // 12시간 이내 확인
  const acceptedAt = new Date(bid.created_at)
  const deadline = new Date(acceptedAt.getTime() + NEGOTIATION_HOURS * 60 * 60 * 1000)
  if (new Date() > deadline) return { error: '흥정 제안 기간(12시간)이 만료되었습니다.' }

  // 이미 흥정 시도했는지 확인
  const { count: exists } = await db
    .from('negotiations')
    .select('*', { count: 'exact', head: true })
    .eq('bid_id', bidId)
  if (exists && exists > 0) return { error: '이미 흥정 제안을 보냈습니다.' }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error: insertErr } = await db
    .from('negotiations')
    .insert({
      request_id: requestId,
      bid_id: bidId,
      clinic_id: user.id,
      supplier_id: bid.supplier_id,
      competitor_url: competitorUrl,
      competitor_price: competitorPrice,
      message,
      expires_at: expiresAt,
    })

  if (insertErr) {
    console.error('createNegotiation error:', insertErr)
    return { error: '흥정 제안 중 오류가 발생했습니다.' }
  }

  // 공급사에게 알림 (fire-and-forget)
  notifyNegotiationReceived(bid.supplier_id, request.title, competitorPrice).catch(console.error)

  revalidatePath(`/clinic/requests/${requestId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// 공급사 → 흥정 수락/거절
// ─────────────────────────────────────────────────────────────────────────────
export async function respondNegotiation(
  negotiationId: string,
  action: 'accepted' | 'rejected'
) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: neg } = await db
    .from('negotiations')
    .select('id, supplier_id, clinic_id, request_id, bid_id, status, expires_at')
    .eq('id', negotiationId)
    .eq('supplier_id', user.id)
    .single()

  if (!neg) return { error: '흥정 건을 찾을 수 없습니다.' }
  if (neg.status !== 'pending') return { error: '이미 처리된 흥정입니다.' }
  if (new Date() > new Date(neg.expires_at)) return { error: '흥정 응답 기한이 만료되었습니다.' }

  const { error: updateErr } = await db
    .from('negotiations')
    .update({ status: action, resolved_at: new Date().toISOString() })
    .eq('id', negotiationId)

  if (updateErr) return { error: '처리 중 오류가 발생했습니다.' }

  // 의원에게 알림
  notifyNegotiationResult(neg.clinic_id, action).catch(console.error)

  revalidatePath('/medi-supplier/negotiations')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// 공급사 알림 — 흥정 수신
// ─────────────────────────────────────────────────────────────────────────────
async function notifyNegotiationReceived(
  supplierUserId: string,
  requestTitle: string,
  price: number | null
) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (admin as any).auth.admin.getUserById(supplierUserId)
  const email = user?.email
  if (!email) return

  const priceText = price ? `경쟁사 가격: ${price.toLocaleString('ko-KR')}원` : ''
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `[BidMedi] 흥정 제안이 도착했습니다 — "${requestTitle}"`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#1A2236;">
        <h2 style="color:#7C3AED;margin-bottom:8px;">💬 흥정 제안이 도착했습니다</h2>
        <p style="font-size:14px;"><strong>"${requestTitle}"</strong> 건의 의원이 흥정을 제안했습니다.</p>
        ${priceText ? `<p style="font-size:14px;color:#6b7280;">${priceText}</p>` : ''}
        <p style="font-size:13px;color:#6b7280;">24시간 내에 수락 또는 거절을 선택해 주세요.</p>
        <a href="https://ai-traffic.kr/medi-supplier/negotiations"
           style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
          흥정 내용 확인하기 →
        </a>
      </div>
    `,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 의원 알림 — 흥정 결과
// ─────────────────────────────────────────────────────────────────────────────
async function notifyNegotiationResult(clinicUserId: string, result: 'accepted' | 'rejected') {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (admin as any).auth.admin.getUserById(clinicUserId)
  const email = user?.email
  if (!email) return

  const accepted = result === 'accepted'
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `[BidMedi] 흥정이 ${accepted ? '수락' : '거절'}되었습니다`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#1A2236;">
        <h2 style="color:${accepted ? '#059669' : '#DC2626'};margin-bottom:8px;">
          ${accepted ? '✅ 흥정이 수락되었습니다!' : '❌ 흥정이 거절되었습니다'}
        </h2>
        <p style="font-size:14px;">
          ${accepted
            ? '공급사가 흥정 가격을 수락했습니다. 공급사 측에서 곧 연락드릴 예정입니다.'
            : '아쉽게도 공급사가 현재 가격을 유지하기로 결정했습니다.'}
        </p>
        <a href="https://ai-traffic.kr/clinic/requests"
           style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
          내 요청 확인하기 →
        </a>
      </div>
    `,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 그룹바이 참여 / 취소
// ─────────────────────────────────────────────────────────────────────────────
export async function joinGroupBuy(groupBuyId: string, qty: number) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await db
    .from('medi_group_buy_participants')
    .upsert({
      group_buy_id: groupBuyId,
      clinic_id: user.id,
      qty: Math.max(1, qty),
    }, { onConflict: 'group_buy_id,clinic_id' })

  if (error) return { error: '참여 중 오류가 발생했습니다.' }

  // current_count 업데이트
  await db.rpc('refresh_group_buy_count', { p_id: groupBuyId }).catch(() => null)

  revalidatePath('/clinic/group-buy')
  return { success: true }
}

export async function leaveGroupBuy(groupBuyId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  await db
    .from('medi_group_buy_participants')
    .delete()
    .eq('group_buy_id', groupBuyId)
    .eq('clinic_id', user.id)

  revalidatePath('/clinic/group-buy')
  return { success: true }
}
