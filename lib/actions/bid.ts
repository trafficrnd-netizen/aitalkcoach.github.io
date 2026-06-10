'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { awardCredits } from '@/lib/credits'

// ── 견적 PDF 첨부 (공급사 양식) ──────────────────────────────────────────────
const QUOTE_MAX_BYTES = 10 * 1024 * 1024 // 10 MB

/** 입찰 폼에서 받은 견적 PDF 유효성 검사 — 문제가 있으면 에러 메시지, 없으면 null */
function validateQuotePdf(file: File | null): string | null {
  if (!file || !file.size) return '공급사 양식의 견적 PDF를 첨부해주세요.'
  if (file.type !== 'application/pdf') return '견적서는 PDF 파일만 업로드할 수 있습니다.'
  if (file.size > QUOTE_MAX_BYTES) return '견적 PDF 크기는 10MB 이하여야 합니다.'
  return null
}

/**
 * 견적 PDF를 bid-quotes 스토리지에 업로드하고 bids 레코드에 경로를 기록한다.
 * 업로드 실패 시 에러 메시지를 반환한다(성공이면 null).
 */
async function uploadQuotePdf(bidId: string, file: File): Promise<string | null> {
  const admin = createAdminClient()
  const filePath = `${bidId}/${Date.now()}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('bid-quotes')
    .upload(filePath, buffer, { contentType: 'application/pdf', upsert: false })
  if (uploadError) {
    console.error('[uploadQuotePdf] upload error:', uploadError)
    return '견적 PDF 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('bids')
    .update({ quote_file_path: filePath, quote_file_name: file.name, quote_file_size: file.size })
    .eq('id', bidId)

  return null
}

export type BidItemInput = {
  requestItemId: string
  totalPrice: number
  available: boolean
}

interface NotificationEmailEntry {
  email: string
  label: string
  verified: boolean
  created_at: string
}

/** 휴대폰 번호 정규화 — 숫자만 추출 */
function normalizePhone(p: string | null | undefined): string {
  return (p ?? '').replace(/\D/g, '')
}

/** 입찰 조건 필드 묶음 */
interface BidConditions {
  lead_time_days: number | null
  customs_duty_included: boolean | null
  cert_responsibility_ack: boolean
  demo_available: boolean | null
  demo_days: number | null
  sample_available: boolean | null
  conditions_note: string | null
}

/** FormData(단건) 또는 평면 객체(묶음)에서 조건 필드 추출 */
function parseBidConditions(src: FormData | Record<string, unknown>): BidConditions {
  const get = (k: string): string => {
    if (src instanceof FormData) return (src.get(k) as string) ?? ''
    const v = src[k]
    return v == null ? '' : String(v)
  }
  const toBool3 = (s: string): boolean | null => (s === 'true' || s === 'yes' ? true : s === 'false' || s === 'no' ? false : null)

  return {
    lead_time_days: get('leadTimeDays') ? Number(get('leadTimeDays')) : null,
    customs_duty_included: toBool3(get('customsDutyIncluded')),
    cert_responsibility_ack: get('certResponsibilityAck') === 'true',
    demo_available: toBool3(get('demoAvailable')),
    demo_days: get('demoDays') ? Number(get('demoDays')) : null,
    sample_available: toBool3(get('sampleAvailable')),
    conditions_note: get('conditionsNote') || null,
  }
}

/**
 * 자전거래(self-dealing) 검증.
 * 한 견적에서 요청자와 입찰자가 동일인이면 입찰을 차단한다.
 * - 1차: 동일 user_id (같은 계정)
 * - 2차: 동일 휴대폰 번호 (같은 사람이 만든 별도 계정)
 * 동일인이면 에러 메시지를, 아니면 null을 반환한다.
 */
async function detectSelfDeal(
  bidderId: string,
  researcherId: string
): Promise<string | null> {
  // 1차: 동일 계정
  if (bidderId === researcherId) {
    return '본인이 등록한 견적 요청에는 입찰할 수 없습니다.'
  }

  // 2차: 동일 인물(휴대폰 일치) — 별도 계정으로 만든 자전거래 차단
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reqProfile } = await (admin as any)
    .from('researcher_profiles')
    .select('phone')
    .eq('user_id', researcherId)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supProfile } = await (admin as any)
    .from('supplier_profiles')
    .select('contact_phone')
    .eq('user_id', bidderId)
    .maybeSingle()

  const requesterPhone = normalizePhone(reqProfile?.phone)
  const bidderPhone = normalizePhone(supProfile?.contact_phone)

  if (requesterPhone && bidderPhone && requesterPhone === bidderPhone) {
    return '동일 인물이 등록한 요청으로 확인되어 입찰할 수 없습니다. (본인 요청 자전거래 방지)'
  }

  return null
}

/** 견적 요청 생성 시각 → 응답 시각 비교하여 1시간 이내면 supplier_fast_response 적립 */
async function maybeAwardFastResponse(supplierId: string, requestId: string) {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: req } = await (admin as any)
      .from('requests')
      .select('created_at')
      .eq('id', requestId)
      .single()
    if (!req?.created_at) return

    const createdMs = new Date(req.created_at).getTime()
    const diffMin = (Date.now() - createdMs) / 60000
    if (diffMin <= 60) {
      await awardCredits(supplierId, 'supplier_fast_response', 'supplier', 'requests', requestId)
    }
  } catch (e) {
    console.error('[maybeAwardFastResponse] error:', e)
  }
}

export async function submitSingleBid(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const requestId = formData.get('requestId') as string
  const totalPrice = Number(formData.get('totalPrice'))
  const deliveryDate = (formData.get('deliveryDate') as string) || null
  const memo = (formData.get('memo') as string) || null
  const quotePdf = formData.get('quotePdf') as File | null

  // 조건 명시 필드
  const cond = parseBidConditions(formData)

  if (!totalPrice || totalPrice <= 0) return { error: '견적 금액을 입력해주세요.' }

  // 공급사 양식 견적 PDF 첨부 필수
  const quoteErr = validateQuotePdf(quotePdf)
  if (quoteErr) return { error: quoteErr }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplier } = await (supabase as any)
    .from('supplier_profiles')
    .select('company_name')
    .eq('user_id', user.id)
    .single()
  if (!supplier) return { error: '공급자 계정이 필요합니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('id, researcher_id, title, status')
    .eq('id', requestId)
    .eq('status', 'open')
    .single()
  if (!request) return { error: '요청을 찾을 수 없거나 이미 마감되었습니다.' }

  // 자전거래 방지 — 요청자와 입찰자가 동일인이면 차단
  const selfDeal = await detectSelfDeal(user.id, request.researcher_id)
  if (selfDeal) return { error: selfDeal }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', requestId)
    .eq('supplier_id', user.id)
  if (Number(count) > 0) return { error: '이미 이 요청에 입찰하셨습니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid, error: bidErr } = await (supabase as any)
    .from('bids')
    .insert({ request_id: requestId, supplier_id: user.id, is_partial: false, delivery_date: deliveryDate, memo, ...cond })
    .select('id')
    .single()
  if (bidErr || !bid) return { error: '입찰 처리 중 오류가 발생했습니다.' }

  // 견적 PDF 업로드 — 실패 시 방금 만든 입찰을 롤백
  const uploadErr = await uploadQuotePdf(bid.id, quotePdf as File)
  if (uploadErr) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bids').delete().eq('id', bid.id)
    return { error: uploadErr }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reqItems } = await (supabase as any)
    .from('request_items')
    .select('id')
    .eq('request_id', requestId)

  if (reqItems?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bid_items').insert(
      (reqItems as Array<{ id: string }>).map(item => ({
        bid_id: bid.id,
        request_item_id: item.id,
        total_price: totalPrice,
        available: true,
      }))
    )
  }

  // 빠른 응답 크레딧 적립 (1시간 이내)
  maybeAwardFastResponse(user.id, requestId).catch(console.error)

  notifyNewBid(request.researcher_id, request.title, supplier.company_name).catch(console.error)

  redirect('/supplier/bids')
}

export async function submitBatchBid(
  requestId: string,
  items: BidItemInput[],
  meta: {
    deliveryDate: string
    memo: string
    leadTimeDays?: string
    customsDutyIncluded?: string
    certResponsibilityAck?: boolean
    demoAvailable?: string
    demoDays?: string
    sampleAvailable?: string
    conditionsNote?: string
  },
  quoteFile?: File | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 공급사 양식 견적 PDF 첨부 필수
  const quoteErr = validateQuotePdf(quoteFile ?? null)
  if (quoteErr) return { error: quoteErr }

  const cond = parseBidConditions({
    leadTimeDays: meta.leadTimeDays,
    customsDutyIncluded: meta.customsDutyIncluded,
    certResponsibilityAck: meta.certResponsibilityAck ? 'true' : '',
    demoAvailable: meta.demoAvailable,
    demoDays: meta.demoDays,
    sampleAvailable: meta.sampleAvailable,
    conditionsNote: meta.conditionsNote,
  })

  const available = items.filter(i => i.available)
  if (!available.length) return { error: '최소 1개 품목을 선택해야 합니다.' }
  if (available.some(i => !i.totalPrice || i.totalPrice <= 0)) return { error: '선택한 품목의 가격을 모두 입력해주세요.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplier } = await (supabase as any)
    .from('supplier_profiles')
    .select('company_name')
    .eq('user_id', user.id)
    .single()
  if (!supplier) return { error: '공급자 계정이 필요합니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('id, researcher_id, title, status')
    .eq('id', requestId)
    .eq('status', 'open')
    .single()
  if (!request) return { error: '요청을 찾을 수 없거나 이미 마감되었습니다.' }

  // 자전거래 방지 — 요청자와 입찰자가 동일인이면 차단
  const selfDeal = await detectSelfDeal(user.id, request.researcher_id)
  if (selfDeal) return { error: selfDeal }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', requestId)
    .eq('supplier_id', user.id)
  if (Number(count) > 0) return { error: '이미 이 요청에 입찰하셨습니다.' }

  const isPartial = available.length < items.length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid, error: bidErr } = await (supabase as any)
    .from('bids')
    .insert({
      request_id: requestId,
      supplier_id: user.id,
      is_partial: isPartial,
      delivery_date: meta.deliveryDate || null,
      memo: meta.memo || null,
      ...cond,
    })
    .select('id')
    .single()
  if (bidErr || !bid) return { error: '입찰 처리 중 오류가 발생했습니다.' }

  // 견적 PDF 업로드 — 실패 시 방금 만든 입찰을 롤백
  const uploadErr = await uploadQuotePdf(bid.id, quoteFile as File)
  if (uploadErr) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('bids').delete().eq('id', bid.id)
    return { error: uploadErr }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('bid_items').insert(
    items.map(item => ({
      bid_id: bid.id,
      request_item_id: item.requestItemId,
      total_price: item.available ? item.totalPrice : null,
      available: item.available,
    }))
  )

  maybeAwardFastResponse(user.id, requestId).catch(console.error)

  notifyNewBid(request.researcher_id, request.title, supplier.company_name).catch(console.error)

  redirect('/supplier/bids')
}

/**
 * 연구자에게 새 견적 도착 알림 발송 — 가입 이메일 + 추가 인증된 이메일 모두에 전송
 */
async function notifyNewBid(researcherId: string, requestTitle: string, supplierName: string) {
  const admin = createAdminClient()

  // 가입 이메일 가져오기
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user: researcher } } = await (admin as any).auth.admin.getUserById(researcherId)
  const primaryEmail: string | undefined = researcher?.email
  if (!primaryEmail) return

  // 추가 알림 이메일 (verified만)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('researcher_profiles')
    .select('notification_emails')
    .eq('user_id', researcherId)
    .single()

  const extras: NotificationEmailEntry[] = profile?.notification_emails ?? []
  const verifiedExtras = extras.filter(e => e.verified).map(e => e.email)

  const recipients = Array.from(new Set([primaryEmail, ...verifiedExtras]))

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: `[ai-traffic.kr] 새 견적이 도착했습니다 — "${requestTitle}"`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#1A2236;">
        <h2 style="color:#1E2F52;margin-bottom:8px;">새 견적이 도착했습니다</h2>
        <p style="font-size:14px;"><strong>${supplierName}</strong>이(가) <strong>"${requestTitle}"</strong>에 견적을 제출했습니다.</p>
        <p style="color:#6b7280;font-size:13px;">마감일까지 입찰을 더 받을 수 있습니다. 플랫폼에서 확인하세요.</p>
        <a href="https://ai-traffic.kr/researcher/requests"
           style="display:inline-block;background:#F4A261;color:#1A2236;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
          내 요청 확인하기 →
        </a>
        <p style="font-size:11px;color:#9ca3af;margin-top:20px;">
          ai-traffic.kr · 연구물품 통합 견적 플랫폼
        </p>
      </div>
    `,
  })
}
