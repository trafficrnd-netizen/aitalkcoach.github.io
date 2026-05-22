import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, FileCheck } from 'lucide-react'

const BID_STATUS_LABEL: Record<string, string> = {
  pending: '검토 중',
  accepted: '낙찰',
  rejected: '미선택',
  expired: '만료',
}

const BID_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  accepted: 'default',
  rejected: 'outline',
  expired: 'outline',
}

export default async function MyBidsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bids } = await (supabase as any)
    .from('bids')
    .select('id, request_id, is_partial, delivery_date, memo, status, created_at')
    .eq('supplier_id', user.id)
    .order('created_at', { ascending: false })

  const requestIds: string[] = (bids ?? []).map((b: { request_id: string }) => b.request_id)

  // Fetch request titles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requestRows } = requestIds.length ? await (supabase as any)
    .from('requests')
    .select('id, title, type, deadline')
    .in('id', requestIds) : { data: [] }

  const requestMap: Record<string, { title: string; type: string; deadline: string | null }> = {}
  for (const r of (requestRows ?? [])) {
    requestMap[r.id] = r
  }

  // Fetch bid_items totals per bid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bidItemRows } = (bids ?? []).length ? await (supabase as any)
    .from('bid_items')
    .select('bid_id, total_price, available')
    .in('bid_id', (bids ?? []).map((b: { id: string }) => b.id)) : { data: [] }

  const bidTotalMap: Record<string, number> = {}
  for (const row of (bidItemRows ?? [])) {
    if (row.available && row.total_price) {
      bidTotalMap[row.bid_id] = (bidTotalMap[row.bid_id] ?? 0) + row.total_price
    }
  }

  // Fetch winning bid price for rejected bids (show to participating suppliers only)
  const rejectedRequestIds = (bids ?? [])
    .filter((b: { status: string }) => b.status === 'rejected')
    .map((b: { request_id: string }) => b.request_id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: winningBidRows } = rejectedRequestIds.length ? await (supabase as any)
    .from('bids')
    .select('id, request_id')
    .in('request_id', rejectedRequestIds)
    .eq('status', 'accepted') : { data: [] }

  const winningBidIds = (winningBidRows ?? []).map((b: { id: string }) => b.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: winningItemRows } = winningBidIds.length ? await (supabase as any)
    .from('bid_items')
    .select('bid_id, total_price, available')
    .in('bid_id', winningBidIds) : { data: [] }

  // request_id → winning total
  const winningTotalByRequest: Record<string, number> = {}
  for (const wb of (winningBidRows ?? [])) {
    const total = (winningItemRows ?? [])
      .filter((i: { bid_id: string; available: boolean; total_price: number }) => i.bid_id === wb.id && i.available)
      .reduce((sum: number, i: { total_price: number }) => sum + (i.total_price ?? 0), 0)
    if (total > 0) winningTotalByRequest[wb.request_id] = total
  }

  // Fetch transactions for accepted bids (to show review link)
  const acceptedBidIds = (bids ?? [])
    .filter((b: { status: string }) => b.status === 'accepted')
    .map((b: { id: string }) => b.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: txRows } = acceptedBidIds.length ? await (supabase as any)
    .from('transactions')
    .select('id, bid_id, status, request_id')
    .in('bid_id', acceptedBidIds) : { data: [] }

  const txByBid: Record<string, { id: string; status: string; request_id: string }> = {}
  for (const tx of (txRows ?? [])) txByBid[tx.bid_id] = tx

  // Check which completed transactions already have supplier review
  const completedTxIds = (txRows ?? []).filter((t: { status: string }) => t.status === 'completed').map((t: { id: string }) => t.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myReviews } = completedTxIds.length ? await (supabase as any)
    .from('reviews')
    .select('transaction_id')
    .in('transaction_id', completedTxIds)
    .eq('reviewer_id', user.id) : { data: [] }
  const reviewedTxIds = new Set<string>((myReviews ?? []).map((r: { transaction_id: string }) => r.transaction_id))

  // 자료 제출 요청 조회 (status = 'requested')
  const allBidIds = (bids ?? []).map((b: { id: string }) => b.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingVerifRows } = allBidIds.length ? await (supabase as any)
    .from('bid_verifications')
    .select('bid_id, status')
    .in('bid_id', allBidIds)
    .in('status', ['requested', 'submitted']) : { data: [] }
  const pendingVerifMap: Record<string, string> = {}
  for (const v of (pendingVerifRows ?? [])) pendingVerifMap[v.bid_id] = v.status

  // Get researcher_id for each accepted request (for review reviewee)
  const acceptedRequestIds = (txRows ?? []).map((t: { request_id: string }) => t.request_id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reqResearchers } = acceptedRequestIds.length ? await (supabase as any)
    .from('requests')
    .select('id, researcher_id')
    .in('id', acceptedRequestIds) : { data: [] }
  const researcherByRequest: Record<string, string> = {}
  for (const r of (reqResearchers ?? [])) researcherByRequest[r.id] = r.researcher_id

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">내 입찰 현황</h1>
          <p className="text-sm text-muted-foreground">제출한 견적과 낙찰 결과를 확인합니다</p>
        </div>
      </div>

      {!bids?.length ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
          아직 입찰한 요청이 없습니다. 입찰 광장에서 요청을 찾아보세요.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(bids as any[]).map(bid => {
            const req = requestMap[bid.request_id]
            const total = bidTotalMap[bid.id]

            return (
              <div
                key={bid.id}
                className={`rounded-lg border p-4 ${bid.status === 'accepted' ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{req?.title ?? '(삭제된 요청)'}</span>
                      {bid.is_partial && (
                        <Badge variant="outline" className="text-xs">부분견적</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {total !== undefined && (
                        <span className="font-medium text-foreground">
                          {total.toLocaleString()}원
                        </span>
                      )}
                      {bid.delivery_date && <span>납기 {bid.delivery_date}</span>}
                      {req?.deadline && <span>요청 마감 {new Date(req.deadline).toLocaleDateString('ko-KR')}</span>}
                      <span>입찰 {new Date(bid.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    {bid.memo && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">메모: {bid.memo}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={BID_STATUS_VARIANT[bid.status] ?? 'outline'}>
                      {BID_STATUS_LABEL[bid.status] ?? bid.status}
                    </Badge>
                    {pendingVerifMap[bid.id] === 'requested' && (
                      <Link
                        href={`/supplier/bids/${bid.id}/verify`}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-200 transition-colors"
                      >
                        <FileCheck className="h-3 w-3" /> 자료 제출 필요
                      </Link>
                    )}
                    {pendingVerifMap[bid.id] === 'submitted' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
                        <FileCheck className="h-3 w-3" /> 자료 검토 중
                      </span>
                    )}
                  </div>
                </div>

                {bid.status === 'rejected' && winningTotalByRequest[bid.request_id] && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      낙찰가{' '}
                      <span className="font-semibold text-foreground">
                        {winningTotalByRequest[bid.request_id].toLocaleString()}원
                      </span>
                      {bidTotalMap[bid.id] && (
                        <span className="ml-1.5">
                          (내 견적 대비{' '}
                          {bidTotalMap[bid.id] > winningTotalByRequest[bid.request_id] ? '+' : ''}
                          {Math.round((bidTotalMap[bid.id] - winningTotalByRequest[bid.request_id]) / winningTotalByRequest[bid.request_id] * 100)}%)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">입찰 참여 공급자에게만 공개됩니다</p>
                  </div>
                )}

                {bid.status === 'accepted' && (() => {
                  const tx = txByBid[bid.id]
                  const isCompleted = tx?.status === 'completed'
                  const needsReview = isCompleted && !reviewedTxIds.has(tx.id)
                  const researcherId = tx ? researcherByRequest[tx.request_id] : undefined
                  return (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      {isCompleted ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700 font-medium">✅ 거래 완료</span>
                          {needsReview && researcherId && tx && (
                            <Link
                              href={`/supplier/transactions/${tx.id}/review?reviewee=${researcherId}`}
                              className="text-xs text-primary underline font-medium"
                            >
                              연구자 평가하기 →
                            </Link>
                          )}
                          {!needsReview && (
                            <span className="text-xs text-muted-foreground">평가 완료</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-primary font-medium">
                          🎉 낙찰! 연구자에게 납품을 진행해주세요.
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
