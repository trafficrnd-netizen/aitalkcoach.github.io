/**
 * 견적 PDF 24시간 경과분 자동 삭제
 * Vercel Cron: 매시간 (다운로드 후 24시간 지난 견적서를 서버에서 삭제)
 *
 * - quote_downloaded_at < now() - 24h AND quote_deleted_at IS NULL AND quote_file_path 존재
 *   → bid-quotes 버킷에서 파일 삭제 + quote_deleted_at 기록
 *
 * Authorization: Bearer ${CRON_SECRET}
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stale, error } = await (admin as any)
    .from('bids')
    .select('id, quote_file_path')
    .lt('quote_downloaded_at', cutoff)
    .is('quote_deleted_at', null)
    .not('quote_file_path', 'is', null)
    .limit(500)

  if (error) return NextResponse.json({ error: String(error.message) }, { status: 500 })
  if (!stale || stale.length === 0) return NextResponse.json({ ok: true, purged: 0 })

  const paths = stale.map((b: { quote_file_path: string }) => b.quote_file_path).filter(Boolean)
  const ids = stale.map((b: { id: string }) => b.id)

  // 스토리지에서 파일 일괄 삭제
  if (paths.length) {
    const { error: rmErr } = await admin.storage.from('bid-quotes').remove(paths)
    if (rmErr) console.error('[purge-quotes] storage remove error:', rmErr)
  }

  // 삭제 시각 기록
  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('bids').update({ quote_deleted_at: now }).in('id', ids)

  return NextResponse.json({ ok: true, purged: ids.length })
}
