import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getQuoteMonitorRows } from '@/lib/admin/quote-monitor'

export const runtime = 'nodejs'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === 'authenticated'
}

/** CSV 셀 이스케이프 */
function cell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function fmt(d: string | null): string {
  return d ? new Date(d).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : ''
}

const TX_LABEL: Record<string, string> = {
  in_progress: '진행 중',
  completed:   '거래 완료',
}
const REQ_LABEL: Record<string, string> = {
  open: '입찰 중', closed: '낙찰 완료', expired: '기간 만료', cancelled: '취소됨',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await getQuoteMonitorRows(500)

  const header = [
    '요청ID', '요청제목', '요청상태', '유형', '게시일', '마감일', '연구자(고객)',
    '거래상태', '거래완료일', '낙찰가', '낙찰공급사',
    '공급사', '견적가', '낙찰여부', '견적PDF', '다운로드횟수', '최초다운로드', '최근다운로드', '서버삭제',
  ]

  const lines: string[] = [header.map(cell).join(',')]

  for (const r of rows) {
    const base = [
      r.requestId,
      r.requestTitle,
      REQ_LABEL[r.requestStatus] ?? r.requestStatus,
      r.requestType === 'batch' ? '묶음' : '단건',
      fmt(r.createdAt),
      r.deadline ?? '',
      r.researcherEmail,
      r.transactionStatus ? (TX_LABEL[r.transactionStatus] ?? r.transactionStatus) : '',
      fmt(r.transactionCompletedAt),
      r.winningPrice != null ? r.winningPrice : '',
      r.winningSupplier ?? '',
    ]

    if (r.bids.length === 0) {
      lines.push([...base, '', '', '', '', '', '', '', ''].map(cell).join(','))
      continue
    }

    for (const b of r.bids) {
      const deleted = b.deletedAt
        ? '삭제됨'
        : b.downloadedAt && Date.now() - new Date(b.downloadedAt).getTime() > 24 * 60 * 60 * 1000
        ? '삭제 예정'
        : ''
      lines.push([
        ...base,
        b.supplierName,
        b.total,
        b.isWinner ? '낙찰' : '',
        b.quoteFileName ?? '',
        b.downloadCount,
        fmt(b.downloadedAt),
        fmt(b.lastDownloadedAt),
        deleted,
      ].map(cell).join(','))
    }
  }

  const csv = '﻿' + lines.join('\r\n') // UTF-8 BOM (Excel 한글 대응)
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bidvibe-monitor-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
