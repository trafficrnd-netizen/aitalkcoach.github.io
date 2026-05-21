import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Badge } from '@/components/ui/badge'
import { cancelRequest } from '@/lib/actions/request'
import { acceptBid } from '@/lib/actions/transaction'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  open:      '입찰 중',
  closed:    '낙찰 완료',
  expired:   '기간 만료',
  cancelled: '취소됨',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  open:      'default',
  closed:    'secondary',
  expired:   'outline',
  cancelled: 'outline',
}

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Round 2: request · items · bidCount — 3개 병렬 ──────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requestRes, itemsRes, bidCountRes] = await Promise.all([
    (supabase as any).from('requests').select('*').eq('id', params.id).eq('researcher_id', user.id).single(),
    (supabase as any).from('request_items').select('*').eq('request_id', params.id),
    (supabase as any).from('bids').select('*', { count: 'exact', head: true }).eq('request_id', params.id),
  ])

  const request  = requestRes.data
  const items    = itemsRes.data
  const bidCount = bidCountRes.count
  if (!request) notFound()

  const isBatch       = request.type === 'batch'
  const canCancel     = request.status === 'open'
  const deadlinePassed = request.deadline ? new Date(request.deadline) < new Date() : false
  const showBids      = deadlinePassed || request.status === 'closed'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bids: any[]    = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let transaction: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
  let supplierMap: Record<string, { company_name: string; plan: string; avg_score: number; review_count: number }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-const
  let bidItemsMap: Record<string, any[]> = {}

  if (showBids || request.status === 'closed') {
    // ── Round 3: bids · transaction — 2개 병렬 ──────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [bidsRes, txRes] = await Promise.all([
      showBids
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (supabase as any)
            .from('bids')
            .select('id, supplier_id, is_partial, delivery_date, memo, status, created_at')
            .eq('request_id', params.id)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] }),
      request.status === 'closed'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (supabase as any)
            .from('transactions')
            .select('id, status, actual_delivery, completed_at, bid_id')
            .eq('request_id', params.id)
            .single()
        : Promise.resolve({ data: null }),
    ])

    bids        = bidsRes.data ?? []
    transaction = txRes.data

    if (bids.length > 0) {
      const supplierIds = bids.map((b: { supplier_id: string }) => b.supplier_id)
      const bidIds      = bids.map((b: { id: string }) => b.id)

      // ── Round 4: supplier profiles · reviews · bid_items — 3개 병렬 ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [profilesRes, reviewsRes, bidItemsRes] = await Promise.all([
        (supabase as any).from('supplier_profiles').select('user_id, company_name, plan').in('user_id', supplierIds),
        (supabase as any).from('reviews').select('reviewee_id, score').in('reviewee_id', supplierIds),
        (supabase as any).from('bid_items').select('bid_id, request_item_id, total_price, available').in('bid_id', bidIds),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reviewStats: Record<string, { total: number; count: number }> = {}
      for (const r of (reviewsRes.data ?? [])) {
        if (!reviewStats[r.reviewee_id]) reviewStats[r.reviewee_id] = { total: 0, count: 0 }
        reviewStats[r.reviewee_id].total += r.score
        reviewStats[r.reviewee_id].count += 1
      }

      for (const p of (profilesRes.data ?? [])) {
        const stats = reviewStats[p.user_id]
        supplierMap[p.user_id] = {
          company_name: p.company_name,
          plan:         p.plan,
          avg_score:    stats ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
          review_count: stats?.count ?? 0,
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of (bidItemsRes.data ?? [])) {
        if (!bidItemsMap[row.bid_id]) bidItemsMap[row.bid_id] = []
        bidItemsMap[row.bid_id].push(row)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getBidTotal(bidId: string): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (bidItemsMap[bidId] ?? []).filter((i: any) => i.available).reduce((s: number, i: any) => s + (i.total_price ?? 0), 0)
  }

  const sortedBids = [...bids].sort((a, b) => getBidTotal(a.id) - getBidTotal(b.id))

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/researcher/requests" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 목록
        </Link>
        <Badge variant={STATUS_VARIANT[request.status] ?? 'outline'}>
          {STATUS_LABEL[request.status] ?? request.status}
        </Badge>
        <span className="text-xs text-muted-foreground">{isBatch ? '묶음' : '단건'}</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">{request.title ?? '(제목 없음)'}</h1>

      {/* 요청 정보 */}
      <section className="rounded-lg border border-border divide-y divide-border mb-6">
        <InfoRow label="게시일"     value={new Date(request.created_at).toLocaleDateString('ko-KR')} />
        {request.deadline && (
          <InfoRow
            label="납기 희망일"
            value={request.deadline}
            highlight={deadlinePassed && request.status === 'open'}
          />
        )}
        {request.delivery_address && <InfoRow label="배송지"        value={request.delivery_address} />}
        {request.notes             && <InfoRow label="추가 요청사항" value={request.notes} />}
        <InfoRow
          label="입찰 현황"
          value={showBids ? `${bidCount ?? 0}건 (비교 가능)` : `${bidCount ?? 0}건 입찰 중 (마감 후 공개)`}
          highlight={Number(bidCount) > 0 && !showBids}
        />
      </section>

      {/* 품목 목록 */}
      <section className="mb-6">
        <h2 className="font-semibold mb-3">품목 목록</h2>
        {isBatch ? (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">물질명</th>
                  <th className="px-3 py-2 text-left font-medium">CAS</th>
                  <th className="px-3 py-2 text-left font-medium">수량</th>
                  <th className="px-3 py-2 text-left font-medium">순도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(items ?? []).map((item: any, idx: number) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">{item.substance_name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.cas_number ?? '—'}</td>
                    <td className="px-3 py-2">{item.qty} {item.unit}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.purity ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items?.map((item: any) => (
            <div key={item.id} className="rounded-lg border border-border divide-y divide-border">
              <InfoRow label="물질명"   value={item.substance_name} />
              {item.cas_number && <InfoRow label="CAS 번호"  value={item.cas_number} mono />}
              <InfoRow label="수량"     value={`${item.qty} ${item.unit ?? ''}`} />
              {item.purity && <InfoRow label="순도" value={item.purity} />}
              {item.volume && <InfoRow label="용량 규격" value={item.volume} />}
            </div>
          ))
        )}
      </section>

      {/* 입찰 대기 중 안내 */}
      {request.status === 'open' && !deadlinePassed && (
        <div className={cn(
          'rounded-lg border p-4 mb-6 text-sm',
          Number(bidCount) > 0 ? 'border-primary/20 bg-primary/5' : 'border-border bg-muted/30'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-primary" />
            <p className="font-medium text-primary">
              {Number(bidCount) > 0 ? `입찰 ${bidCount}건 도착` : '입찰 대기 중'}
            </p>
          </div>
          <p className="text-muted-foreground">
            마감일({request.deadline}) 이후 견적 금액이 공개되고 비교할 수 있습니다.
          </p>
        </div>
      )}

      {/* 마감 후 — 견적 비교 */}
      {showBids && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3">
            {isBatch ? '공급자별 견적 비교' : '견적 비교'}
            {request.status === 'open' && deadlinePassed && (
              <span className="ml-2 text-xs font-normal text-amber-600">마감됨 — 견적 선택 가능</span>
            )}
          </h2>

          {!bids.length ? (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              접수된 견적이 없습니다.
            </div>
          ) : isBatch ? (
            // ── 묶음 매트릭스 ──
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium border-b border-r border-border">품목</th>
                    {sortedBids.map((bid, idx) => {
                      const s = supplierMap[bid.supplier_id]
                      return (
                        <th key={bid.id} className="px-3 py-2.5 text-center font-medium border-b border-r border-border min-w-28">
                          <div>{s?.company_name ?? '—'}</div>
                          {idx === 0 && <div className="text-[10px] font-normal text-primary">최저가</div>}
                          {bid.is_partial && <div className="text-[10px] font-normal text-amber-600">부분견적</div>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(items ?? []).map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 border-r border-border">
                        <div className="font-medium">{item.substance_name}</div>
                        <div className="text-xs text-muted-foreground">{item.qty} {item.unit}</div>
                      </td>
                      {sortedBids.map(bid => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const bidItem = (bidItemsMap[bid.id] ?? []).find((bi: any) => bi.request_item_id === item.id)
                        return (
                          <td key={bid.id} className="px-3 py-2 text-center border-r border-border">
                            {bidItem?.available
                              ? <span className="font-medium">{(bidItem.total_price ?? 0).toLocaleString()}원</span>
                              : <span className="text-muted-foreground text-xs">미공급</span>
                            }
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-semibold">
                    <td className="px-3 py-2.5 border-r border-border">합계</td>
                    {sortedBids.map(bid => (
                      <td key={bid.id} className="px-3 py-2.5 text-center border-r border-border text-primary">
                        {getBidTotal(bid.id).toLocaleString()}원
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            // ── 단건 목록 ──
            <div className="flex flex-col gap-3">
              {sortedBids.map((bid, idx) => {
                const s         = supplierMap[bid.supplier_id]
                const total     = getBidTotal(bid.id)
                const isAccepted = bid.status === 'accepted'
                const isLowest  = idx === 0

                return (
                  <div
                    key={bid.id}
                    className={cn(
                      'rounded-lg border p-4',
                      isAccepted ? 'border-primary bg-primary/5' : isLowest ? 'border-primary/40' : 'border-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{s?.company_name ?? '—'}</span>
                          {isLowest && !isAccepted && <Badge className="text-xs">최저가</Badge>}
                          {isAccepted && (
                            <Badge className="text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" /> 낙찰
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {bid.delivery_date && <span>납기 {bid.delivery_date}</span>}
                          {s && s.review_count > 0 && <span>⭐ {s.avg_score} ({s.review_count}건)</span>}
                          {bid.is_partial && <span className="text-amber-600">부분견적</span>}
                        </div>
                        {bid.memo && <p className="mt-1.5 text-xs text-muted-foreground">{bid.memo}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-primary mb-2">{total.toLocaleString()}원</div>
                        {request.status === 'open' && !isAccepted && (
                          <form action={acceptBid.bind(null, bid.id, params.id)}>
                            <SubmitButton
                              pendingText="처리 중…"
                              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                            >
                              수락
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 묶음 수락 버튼 */}
          {isBatch && request.status === 'open' && sortedBids.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {sortedBids.map((bid, idx) => {
                const s = supplierMap[bid.supplier_id]
                return (
                  <form key={bid.id} action={acceptBid.bind(null, bid.id, params.id)}>
                    <SubmitButton
                      pendingText="처리 중…"
                      className={cn(
                        'inline-flex items-center justify-center rounded-md px-4 py-2 text-xs font-semibold shadow transition-colors',
                        idx === 0
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'border border-border bg-background hover:bg-muted'
                      )}
                    >
                      {s?.company_name} 수락 ({getBidTotal(bid.id).toLocaleString()}원)
                    </SubmitButton>
                  </form>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* 거래 진행 상태 */}
      {transaction && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3">거래 진행 상태</h2>
          <div className={cn(
            'rounded-lg border p-4',
            transaction.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-primary/20 bg-primary/5'
          )}>
            {transaction.status === 'completed' ? (
              <div>
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                  <CheckCircle2 className="h-4 w-4" /> 거래 완료
                </div>
                {transaction.actual_delivery && (
                  <p className="text-sm text-green-700">실제 납품일: {transaction.actual_delivery}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  완료: {transaction.completed_at ? new Date(transaction.completed_at).toLocaleDateString('ko-KR') : '—'}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-primary mb-1">납품 대기 중</p>
                <p className="text-sm text-muted-foreground mb-3">
                  공급자가 납품을 완료하면 거래 완료를 신고해주세요. 이후 만족도 평가를 남길 수 있습니다.
                </p>
                <Link href={`/researcher/transactions/${transaction.id}/complete`} className={buttonVariants({ size: 'sm' })}>
                  거래 완료 신고
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 요청 취소 */}
      {canCancel && (
        <form action={cancelRequest.bind(null, params.id)}>
          <SubmitButton
            pendingText="취소 중…"
            className="text-sm text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
          >
            이 요청 취소하기
          </SubmitButton>
        </form>
      )}
    </div>
  )
}

function InfoRow({ label, value, mono, highlight }: {
  label: string; value: string; mono?: boolean; highlight?: boolean
}) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono' : ''} ${highlight ? 'font-medium text-primary' : ''}`}>
        {value}
      </span>
    </div>
  )
}
