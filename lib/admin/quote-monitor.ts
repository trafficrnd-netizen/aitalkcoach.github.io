/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type MonitorBid = {
  bidId: string
  supplierName: string
  total: number
  isWinner: boolean
  quoteFileName: string | null
  downloadCount: number
  downloadedAt: string | null
  lastDownloadedAt: string | null
  deletedAt: string | null
}

export type MonitorRow = {
  requestId: string
  requestTitle: string
  requestStatus: string
  requestType: string
  createdAt: string
  deadline: string | null
  researcherEmail: string
  transactionStatus: string | null
  transactionCompletedAt: string | null
  winningPrice: number | null
  winningSupplier: string | null
  bidCount: number
  bids: MonitorBid[]
}

/**
 * 어드민 모니터링용 데이터 집계 —
 * 최근 요청별 거래경과·낙찰가·견적 PDF 다운로드 기록을 묶어 반환한다.
 */
export async function getQuoteMonitorRows(limit = 100): Promise<MonitorRow[]> {
  // 최근 요청
  const { data: requests } = await (admin as any)
    .from('requests')
    .select('id, title, status, type, created_at, deadline, researcher_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!requests || requests.length === 0) return []

  const requestIds = requests.map((r: any) => r.id)
  const researcherIds: string[] = Array.from(new Set(requests.map((r: any) => r.researcher_id)))

  // 입찰 · 거래 · 사용자 병렬 조회
  const [bidsRes, txRes, usersRes] = await Promise.all([
    (admin as any)
      .from('bids')
      .select('id, request_id, supplier_id, status, created_at, quote_file_name, quote_download_count, quote_downloaded_at, quote_last_downloaded_at, quote_deleted_at')
      .in('request_id', requestIds),
    (admin as any)
      .from('transactions')
      .select('request_id, bid_id, status, completed_at')
      .in('request_id', requestIds),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const bids = bidsRes.data ?? []
  const transactions = txRes.data ?? []
  const bidIds = bids.map((b: any) => b.id)
  const supplierIds: string[] = Array.from(new Set(bids.map((b: any) => b.supplier_id)))

  // bid_items 합계 · 공급사명 병렬 조회
  const [bidItemsRes, suppliersRes] = await Promise.all([
    bidIds.length
      ? (admin as any).from('bid_items').select('bid_id, total_price, available').in('bid_id', bidIds)
      : Promise.resolve({ data: [] }),
    supplierIds.length
      ? (admin as any).from('supplier_profiles').select('user_id, company_name').in('user_id', supplierIds)
      : Promise.resolve({ data: [] }),
  ])

  // 맵 구성
  const bidTotalMap: Record<string, number> = {}
  for (const bi of (bidItemsRes.data ?? [])) {
    if (!bi.available) continue
    bidTotalMap[bi.bid_id] = (bidTotalMap[bi.bid_id] ?? 0) + Number(bi.total_price ?? 0)
  }
  const supplierMap: Record<string, string> = {}
  for (const s of (suppliersRes.data ?? [])) supplierMap[s.user_id] = s.company_name

  const emailMap: Record<string, string> = {}
  for (const u of (usersRes.data?.users ?? [])) {
    if (researcherIds.includes(u.id)) emailMap[u.id] = u.email ?? '—'
  }

  const txByRequest: Record<string, { status: string; bid_id: string; completed_at: string | null }> = {}
  for (const t of transactions) txByRequest[t.request_id] = t

  const bidsByRequest: Record<string, any[]> = {}
  for (const b of bids) {
    if (!bidsByRequest[b.request_id]) bidsByRequest[b.request_id] = []
    bidsByRequest[b.request_id].push(b)
  }

  const rows: MonitorRow[] = requests.map((r: any) => {
    const tx = txByRequest[r.id] ?? null
    const reqBids = (bidsByRequest[r.id] ?? []).sort(
      (a, b) => (bidTotalMap[a.id] ?? 0) - (bidTotalMap[b.id] ?? 0)
    )
    const winnerBid = reqBids.find((b) => b.status === 'accepted') ?? null

    const monitorBids: MonitorBid[] = reqBids.map((b) => ({
      bidId:            b.id,
      supplierName:     supplierMap[b.supplier_id] ?? '—',
      total:            bidTotalMap[b.id] ?? 0,
      isWinner:         b.status === 'accepted',
      quoteFileName:    b.quote_file_name ?? null,
      downloadCount:    b.quote_download_count ?? 0,
      downloadedAt:     b.quote_downloaded_at ?? null,
      lastDownloadedAt: b.quote_last_downloaded_at ?? null,
      deletedAt:        b.quote_deleted_at ?? null,
    }))

    return {
      requestId:              r.id,
      requestTitle:           r.title ?? '(제목 없음)',
      requestStatus:          r.status,
      requestType:            r.type,
      createdAt:              r.created_at,
      deadline:               r.deadline ?? null,
      researcherEmail:        emailMap[r.researcher_id] ?? '—',
      transactionStatus:      tx?.status ?? null,
      transactionCompletedAt: tx?.completed_at ?? null,
      winningPrice:           winnerBid ? (bidTotalMap[winnerBid.id] ?? 0) : null,
      winningSupplier:        winnerBid ? (supplierMap[winnerBid.supplier_id] ?? '—') : null,
      bidCount:               reqBids.length,
      bids:                   monitorBids,
    }
  })

  return rows
}
