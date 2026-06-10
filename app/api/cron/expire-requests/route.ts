/**
 * 마감일 경과 견적 요청 자동 만료 처리
 * Vercel Cron: 매일 1회 (예: 00:10 UTC = 09:10 KST)
 *
 * - status='open' AND deadline < 오늘 → status='expired'
 * - 연구자에게 결과 알림 (입찰 N건 — 선택 또는 마감 연장 안내)
 *
 * Authorization: Bearer ${CRON_SECRET}
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { notifyGroupBuys } from '@/lib/group-buy-notify'

export const runtime = 'nodejs'
export const maxDuration = 60

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().slice(0, 10)

  // 마감 경과 + 미마감 요청 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expired, error } = await (admin as any)
    .from('requests')
    .select('id, researcher_id, title, deadline')
    .eq('status', 'open')
    .lt('deadline', today)
    .not('deadline', 'is', null)
    .limit(200)

  if (error) return NextResponse.json({ error: String(error.message) }, { status: 500 })
  if (!expired || expired.length === 0) return NextResponse.json({ ok: true, expired: 0 })

  const ids = expired.map((r: { id: string }) => r.id)

  // 일괄 만료 처리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('requests').update({ status: 'expired' }).in('id', ids)

  // 연구자별 알림 (입찰 수 포함)
  let notified = 0
  for (const r of expired) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: bidCount } = await (admin as any)
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', r.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: usr } = await (admin as any).auth.admin.getUserById(r.researcher_id)
      const email = usr?.user?.email
      if (!email) continue

      const n = Number(bidCount) || 0
      const body = n > 0
        ? `<p><strong>"${r.title}"</strong> 요청이 마감되었습니다. <strong>${n}건</strong>의 견적이 도착했습니다. 지금 비교하고 낙찰하세요.</p>`
        : `<p><strong>"${r.title}"</strong> 요청이 입찰 없이 마감되었습니다. 마감일을 늘리거나 조건을 조정해 다시 요청해 보세요.</p>`

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `[ai-traffic.kr] 견적 요청 마감 — "${r.title}" (입찰 ${n}건)`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
            <h2 style="color:#1E2F52;margin-bottom:8px;">견적 요청이 마감되었습니다</h2>
            ${body}
            <a href="https://ai-traffic.kr/researcher/requests" style="display:inline-block;background:#F4A261;color:#1A2236;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;font-weight:600;">내 요청 확인하기 →</a>
            <p style="font-size:11px;color:#9ca3af;margin-top:20px;">ai-traffic.kr · 연구물품 통합 견적 플랫폼</p>
          </div>
        `,
      })
      notified++
    } catch (e) {
      console.error('[expire-requests] 알림 실패:', r.id, e)
    }
  }

  // 그룹 바이 알림 (같은 cron에 통합 — Hobby 1일 1회 제약)
  let groupBuy = { clusters: 0, emailed: 0 }
  try {
    groupBuy = await notifyGroupBuys()
  } catch (e) {
    console.error('[cron] 그룹바이 알림 실패:', e)
  }

  // 견적 PDF 24시간 경과분 자동 삭제 (안전망 — 전용 hourly cron 외 일일 보조 정리)
  let quotesPurged = 0
  try {
    quotesPurged = await purgeExpiredQuotes()
  } catch (e) {
    console.error('[cron] 견적 PDF 정리 실패:', e)
  }

  return NextResponse.json({ ok: true, expired: ids.length, notified, groupBuy, quotesPurged })
}

/** 다운로드 후 24시간 지난 견적 PDF를 스토리지에서 삭제하고 시각을 기록한다. */
async function purgeExpiredQuotes(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stale } = await (admin as any)
    .from('bids')
    .select('id, quote_file_path')
    .lt('quote_downloaded_at', cutoff)
    .is('quote_deleted_at', null)
    .not('quote_file_path', 'is', null)
    .limit(500)

  if (!stale || stale.length === 0) return 0

  const paths = stale.map((b: { quote_file_path: string }) => b.quote_file_path).filter(Boolean)
  const idList = stale.map((b: { id: string }) => b.id)

  if (paths.length) {
    const { error: rmErr } = await admin.storage.from('bid-quotes').remove(paths)
    if (rmErr) console.error('[purgeExpiredQuotes] storage remove error:', rmErr)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('bids').update({ quote_deleted_at: new Date().toISOString() }).in('id', idList)
  return idList.length
}
