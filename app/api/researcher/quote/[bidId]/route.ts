/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const QUOTE_TTL_MS = 24 * 60 * 60 * 1000 // 다운로드 후 24시간

/**
 * 연구자 견적 PDF 다운로드 (비교용)
 * - 본인 요청에 들어온 입찰의 견적서만 다운로드 가능
 * - 다운로드 시각/횟수를 기록
 * - 최초 다운로드 후 24시간이 지나면 서버에서 자동 삭제(lazy purge) → 410 응답
 */
export async function GET(_req: NextRequest, { params }: { params: { bidId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const admin = createAdminClient()

  // 입찰 + 요청 소유자 확인
  const { data: bid } = await (admin as any)
    .from('bids')
    .select('id, request_id, quote_file_path, quote_file_name, quote_downloaded_at, quote_download_count, quote_deleted_at')
    .eq('id', params.bidId)
    .single()
  if (!bid || !bid.quote_file_path) {
    return NextResponse.json({ error: '견적서를 찾을 수 없습니다.' }, { status: 404 })
  }

  const { data: request } = await (admin as any)
    .from('requests')
    .select('researcher_id')
    .eq('id', bid.request_id)
    .single()
  if (!request || request.researcher_id !== user.id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  // 이미 삭제됨
  if (bid.quote_deleted_at) {
    return NextResponse.json({ error: '다운로드 기간(24시간)이 지나 서버에서 삭제되었습니다.', deleted: true }, { status: 410 })
  }

  // 최초 다운로드 후 24시간 경과 → 지금 삭제하고 만료 응답 (lazy purge)
  if (bid.quote_downloaded_at && Date.now() - new Date(bid.quote_downloaded_at).getTime() > QUOTE_TTL_MS) {
    await admin.storage.from('bid-quotes').remove([bid.quote_file_path])
    await (admin as any).from('bids').update({ quote_deleted_at: new Date().toISOString() }).eq('id', bid.id)
    return NextResponse.json({ error: '다운로드 기간(24시간)이 지나 서버에서 삭제되었습니다.', deleted: true }, { status: 410 })
  }

  // 파일 다운로드
  const { data: blob, error: dlErr } = await admin.storage.from('bid-quotes').download(bid.quote_file_path)
  if (dlErr || !blob) {
    return NextResponse.json({ error: '파일을 불러오지 못했습니다.' }, { status: 502 })
  }
  const arrayBuffer = await blob.arrayBuffer()

  // 다운로드 기록 갱신 (최초 시각 보존, 마지막 시각·횟수 갱신)
  const now = new Date().toISOString()
  await (admin as any)
    .from('bids')
    .update({
      quote_downloaded_at: bid.quote_downloaded_at ?? now,
      quote_last_downloaded_at: now,
      quote_download_count: (bid.quote_download_count ?? 0) + 1,
    })
    .eq('id', bid.id)

  const fileName = bid.quote_file_name || `quote-${bid.id}.pdf`
  const encoded = encodeURIComponent(fileName)

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quote.pdf"; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'no-store',
    },
  })
}
