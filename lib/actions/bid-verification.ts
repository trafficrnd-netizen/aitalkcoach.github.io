'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect }          from 'next/navigation'
import { resend, FROM_EMAIL } from '@/lib/resend'

const APP_URL         = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bidvibe.ai-traffic.kr'
const ALLOWED_TYPES   = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
const MAX_BYTES       = 10 * 1024 * 1024  // 10 MB

// ─────────────────────────────────────────────────────────────────────────────
// 연구자: 공급자에게 진위성 자료 제출 요청
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requestVerification(bidId: string, requestId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [requestRes, bidRes] = await Promise.all([
    (admin as any).from('requests').select('id, researcher_id, title, status').eq('id', requestId).eq('researcher_id', user.id).single(),
    (admin as any).from('bids').select('id, supplier_id, status').eq('id', bidId).eq('request_id', requestId).single(),
  ])

  const request = requestRes.data
  const bid     = bidRes.data
  if (!request || request.status !== 'open') redirect(`/researcher/requests/${requestId}`)
  if (!bid) redirect(`/researcher/requests/${requestId}`)

  // 이미 requested/submitted/accepted 상태면 재요청 차단 (rejected는 재요청 허용 → upsert)
  const { data: existing } = await (admin as any)
    .from('bid_verifications').select('status').eq('bid_id', bidId).single()
  if (existing && ['requested', 'submitted', 'accepted'].includes(existing.status)) {
    redirect(`/researcher/requests/${requestId}`)
  }

  // 신규 요청 or 반려 후 재요청 (upsert)
  await (admin as any).from('bid_verifications').upsert(
    {
      bid_id:        bidId,
      request_id:    requestId,
      researcher_id: user.id,
      supplier_id:   bid.supplier_id,
      status:        'requested',
      file_path:     null,
      file_name:     null,
      file_size:     null,
      submitted_at:  null,
      reviewed_at:   null,
      requested_at:  new Date().toISOString(),
    },
    { onConflict: 'bid_id' },
  )

  notifySupplierVerificationRequested(bid.supplier_id, request.title, bidId).catch(console.error)

  redirect(`/researcher/requests/${requestId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 공급자: 자료 파일 업로드 제출
// ─────────────────────────────────────────────────────────────────────────────
export async function submitVerificationFile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bidId = formData.get('bidId') as string
  const file  = formData.get('file')  as File | null

  if (!file || !file.size)         return { error: '파일을 선택해주세요.' }
  if (!ALLOWED_TYPES.has(file.type)) return { error: 'PDF · JPG · PNG · WEBP · HEIC 파일만 가능합니다.' }
  if (file.size > MAX_BYTES)        return { error: '파일 크기는 10MB 이하여야 합니다.' }

  const admin = createAdminClient()

  // 공급자 소유 + requested 상태 검증
  const { data: verification } = await (admin as any)
    .from('bid_verifications')
    .select('id, researcher_id, request_id, status')
    .eq('bid_id',      bidId)
    .eq('supplier_id', user.id)
    .eq('status',      'requested')
    .single()
  if (!verification) return { error: '자료 제출 요청을 찾을 수 없습니다.' }

  // Supabase Storage 업로드
  const ext      = (file.name.split('.').pop() ?? 'bin').toLowerCase()
  const filePath = `${bidId}/${Date.now()}.${ext}`
  const buffer   = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('bid-verifications')
    .upload(filePath, buffer, { contentType: file.type, upsert: false })
  if (uploadError) return { error: '파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.' }

  // 레코드 업데이트
  await (admin as any)
    .from('bid_verifications')
    .update({
      status:       'submitted',
      file_path:    filePath,
      file_name:    file.name,
      file_size:    file.size,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', verification.id)

  // 연구자에게 이메일 발송 (병렬)
  const [supplierRes, requestRes] = await Promise.all([
    (admin as any).from('supplier_profiles').select('company_name').eq('user_id', user.id).single(),
    (admin as any).from('requests').select('title').eq('id', verification.request_id).single(),
  ])
  notifyResearcherDocSubmitted(
    verification.researcher_id,
    requestRes.data?.title ?? '',
    supplierRes.data?.company_name ?? '공급자',
    verification.request_id,
  ).catch(console.error)

  redirect('/supplier/bids')
}

// ─────────────────────────────────────────────────────────────────────────────
// 연구자: 제출된 자료 검토 — 수락(accept) 또는 반려(reject)
// ─────────────────────────────────────────────────────────────────────────────
export async function reviewVerification(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const verificationId = formData.get('verificationId') as string
  const bidId          = formData.get('bidId')          as string
  const requestId      = formData.get('requestId')      as string
  const action         = formData.get('action')         as string  // 'accept' | 'reject'

  const admin = createAdminClient()

  const { data: verification } = await (admin as any)
    .from('bid_verifications')
    .select('id, status, supplier_id')
    .eq('id',            verificationId)
    .eq('researcher_id', user.id)
    .single()

  if (!verification || verification.status !== 'submitted') redirect(`/researcher/requests/${requestId}`)

  // ── 반려 ──────────────────────────────────────────────────────────────────
  if (action === 'reject') {
    await (admin as any)
      .from('bid_verifications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', verificationId)
    redirect(`/researcher/requests/${requestId}`)
  }

  // ── 수락 → 낙찰 처리 ─────────────────────────────────────────────────────
  const { data: request } = await (admin as any)
    .from('requests')
    .select('id, researcher_id, title, status')
    .eq('id',            requestId)
    .eq('researcher_id', user.id)
    .single()
  if (!request || request.status !== 'open') redirect(`/researcher/requests/${requestId}`)

  await Promise.all([
    (admin as any).from('bid_verifications').update({ status: 'accepted', reviewed_at: new Date().toISOString() }).eq('id', verificationId),
    (admin as any).from('bids').update({ status: 'accepted'  }).eq('id', bidId),
    (admin as any).from('bids').update({ status: 'rejected'  }).eq('request_id', requestId).neq('id', bidId),
    (admin as any).from('requests').update({ status: 'closed' }).eq('id', requestId),
    (admin as any).from('transactions').insert({ request_id: requestId, bid_id: bidId, status: 'in_progress' }),
  ])

  notifyBidAccepted(verification.supplier_id, request.title).catch(console.error)

  redirect(`/researcher/requests/${requestId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 이메일 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

async function notifySupplierVerificationRequested(supplierId: string, requestTitle: string, bidId: string) {
  const admin = createAdminClient()
  const { data: usr } = await (admin as any).from('users').select('email').eq('id', supplierId).single()
  if (!usr?.email) return

  await resend.emails.send({
    from:    FROM_EMAIL,
    to:      usr.email,
    subject: `[BidVibe] 진위성 자료 제출 요청 — "${requestTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#6d28d9;margin-bottom:8px;">📋 자료 제출 요청</h2>
        <p>연구자가 <strong>"${requestTitle}"</strong> 입찰에 대한 공급 가능 여부를 확인할 수 있는 자료를 요청했습니다.</p>
        <p style="color:#6b7280;margin-top:8px;">사양서(Spec Sheet), 재고 확인서, COA 등 관련 자료를 업로드해주세요.</p>
        <p style="color:#6b7280;">자료 제출 후 연구자의 검토를 거쳐 낙찰이 확정됩니다.</p>
        <a href="${APP_URL}/supplier/bids/${bidId}/verify"
           style="display:inline-block;background:#6d28d9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
          자료 제출하러 가기 →
        </a>
      </div>
    `,
  })
}

async function notifyResearcherDocSubmitted(
  researcherId: string,
  requestTitle: string,
  supplierName: string,
  requestId: string,
) {
  const admin = createAdminClient()
  const { data: usr } = await (admin as any).from('users').select('email').eq('id', researcherId).single()
  if (!usr?.email) return

  await resend.emails.send({
    from:    FROM_EMAIL,
    to:      usr.email,
    subject: `[BidVibe] 📄 진위성 자료가 제출되었습니다 — "${requestTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#6d28d9;margin-bottom:8px;">📄 자료 제출 완료</h2>
        <p><strong>${supplierName}</strong>이(가) <strong>"${requestTitle}"</strong>에 대한 진위성 자료를 제출했습니다.</p>
        <p style="color:#6b7280;margin-top:8px;">BidVibe에서 자료를 확인하고 수락 또는 반려를 선택해주세요.</p>
        <a href="${APP_URL}/researcher/requests/${requestId}"
           style="display:inline-block;background:#6d28d9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
          자료 확인하러 가기 →
        </a>
      </div>
    `,
  })
}

async function notifyBidAccepted(supplierId: string, requestTitle: string) {
  const admin = createAdminClient()
  const [usrRes, profileRes] = await Promise.all([
    (admin as any).from('users').select('email').eq('id', supplierId).single(),
    (admin as any).from('supplier_profiles').select('company_name').eq('user_id', supplierId).single(),
  ])
  if (!usrRes.data?.email) return

  await resend.emails.send({
    from:    FROM_EMAIL,
    to:      usrRes.data.email,
    subject: `[BidVibe] 🎉 낙찰 알림 — "${requestTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#6d28d9;margin-bottom:8px;">🎉 낙찰되었습니다!</h2>
        <p>${profileRes.data?.company_name ?? '공급자'}님의 견적이 채택되었습니다.</p>
        <p><strong>"${requestTitle}"</strong> 요청에 대한 납품을 진행해주세요.</p>
        <p style="color:#6b7280;">납품 완료 후 연구자가 거래 완료를 신고하면 거래가 종료됩니다.</p>
        <a href="${APP_URL}/supplier/bids"
           style="display:inline-block;background:#6d28d9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
          내 입찰 확인하기 →
        </a>
      </div>
    `,
  })
}
