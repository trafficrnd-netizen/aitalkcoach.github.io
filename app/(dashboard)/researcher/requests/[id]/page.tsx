/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect }         from 'next/navigation'
import Link                           from 'next/link'
import { createClient }               from '@/lib/supabase/server'
import { createAdminClient }          from '@/lib/supabase/admin'
import { buttonVariants }             from '@/components/ui/button'
import { SubmitButton }               from '@/components/ui/submit-button'
import { Badge }                      from '@/components/ui/badge'
import { cancelRequest }              from '@/lib/actions/request'
import { acceptBid }                  from '@/lib/actions/transaction'
import { requestVerification, reviewVerification } from '@/lib/actions/bid-verification'
import { getGroupBuyPeers } from '@/lib/actions/group-buy'
import { getCatalogForSubstance } from '@/lib/actions/supplier-catalog'
import { GroupBuyBanner } from '@/components/group-buy-banner'
import { CatalogSuppliers } from '@/components/catalog-suppliers'
import { ArrowLeft, CheckCircle2, Clock, FileCheck, FileSearch, FileMinus, FileText } from 'lucide-react'
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

// 검증 상태 뱃지
function VeriBadge({ status }: { status: string }) {
  if (status === 'requested') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
      <Clock className="h-3 w-3" /> 자료 대기 중
    </span>
  )
  if (status === 'submitted') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
      <FileSearch className="h-3 w-3" /> 자료 검토 필요
    </span>
  )
  if (status === 'accepted') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
      <FileCheck className="h-3 w-3" /> 자료 확인됨
    </span>
  )
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-600">
      <FileMinus className="h-3 w-3" /> 자료 반려됨
    </span>
  )
  return null
}

export default async function RequestDetailPage({ params, searchParams }: { params: { id: string }; searchParams?: { filter?: string } }) {
  const filter = (searchParams?.filter as 'all' | 'tier' | 'fast' | 'safe' | undefined) ?? 'all'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Round 2: request · items · bidCount — 3개 병렬 ──────────────────────
  const [requestRes, itemsRes, bidCountRes] = await Promise.all([
    (supabase as any).from('requests').select('*').eq('id', params.id).eq('researcher_id', user.id).single(),
    (supabase as any).from('request_items').select('*').eq('request_id', params.id),
    (supabase as any).from('bids').select('*', { count: 'exact', head: true }).eq('request_id', params.id),
  ])

  const request  = requestRes.data
  const items    = itemsRes.data
  const bidCount = bidCountRes.count
  if (!request) notFound()

  const isBatch        = request.type === 'batch'
  const canCancel      = request.status === 'open'
  const deadlinePassed = request.deadline ? new Date(request.deadline) < new Date() : false
  const showBids       = deadlinePassed || request.status === 'closed'

  // 그룹 바이 + 카탈로그 — 첫 품목 기준 (대부분 단건 요청은 그대로, 묶음은 대표 품목 기준)
  const firstItem = (items ?? [])[0] ?? null
  const [groupBuyPeers, catalogSuppliers] = await Promise.all([
    request.status === 'open' ? getGroupBuyPeers(params.id) : Promise.resolve(null),
    firstItem ? getCatalogForSubstance({ cas: firstItem.cas_number, name: firstItem.substance_name }, 5) : Promise.resolve([]),
  ])

  let bids:        any[]  = []
  let transaction: any    = null
  // eslint-disable-next-line prefer-const
  let supplierMap:     Record<string, { company_name: string; plan: string; avg_score: number; review_count: number; origin: string; country: string | null; overseas_supply_type: string | null; or_type: string | null; tier: string | null; fast_responder: boolean }> = {}
  // eslint-disable-next-line prefer-const
  let bidItemsMap:     Record<string, any[]> = {}
  // eslint-disable-next-line prefer-const
  let verificationMap: Record<string, { id: string; status: string; filePath: string | null; fileName: string | null; fileSize: number | null }> = {}
  // eslint-disable-next-line prefer-const
  let signedUrlMap:    Record<string, string> = {}
  // 입찰 시 첨부된 공급사 양식 견적 PDF — 수락 전 비교 다운로드 + 24h 삭제 상태
  // eslint-disable-next-line prefer-const
  let quoteMap:        Record<string, { name: string | null; size: number | null; downloadedAt: string | null; deletedAt: string | null }> = {}

  if (showBids || request.status === 'closed') {
    // ── Round 3: bids · transaction — 2개 병렬 ──────────────────────────────
    const [bidsRes, txRes] = await Promise.all([
      showBids
        ? (supabase as any).from('bids')
            .select('id, supplier_id, is_partial, delivery_date, memo, status, created_at, lead_time_days, customs_duty_included, cert_responsibility_ack, demo_available, demo_days, sample_available, conditions_note, quote_file_path, quote_file_name, quote_file_size, quote_downloaded_at, quote_last_downloaded_at, quote_download_count, quote_deleted_at')
            .eq('request_id', params.id)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] }),
      request.status === 'closed'
        ? (supabase as any).from('transactions')
            .select('id, status, actual_delivery, completed_at, bid_id')
            .eq('request_id', params.id)
            .single()
        : Promise.resolve({ data: null }),
    ])

    bids        = bidsRes.data ?? []
    transaction = txRes.data

    if (bids.length > 0) {
      const supplierIds = bids.map((b: any) => b.supplier_id)
      const bidIds      = bids.map((b: any) => b.id)

      // ── Round 4: profiles · reviews · bid_items · verifications — 4개 병렬 ──
      const [profilesRes, reviewsRes, bidItemsRes, verificationsRes] = await Promise.all([
        (supabase as any).from('supplier_profiles').select('user_id, company_name, plan, origin, country, overseas_supply_type, or_type, referral_tier').in('user_id', supplierIds),
        (supabase as any).from('reviews').select('reviewee_id, score').in('reviewee_id', supplierIds),
        (supabase as any).from('bid_items').select('bid_id, request_item_id, total_price, available').in('bid_id', bidIds),
        (supabase as any).from('bid_verifications')
          .select('id, bid_id, status, file_path, file_name, file_size')
          .in('bid_id', bidIds),
      ])

      // supplierMap 구성
      const reviewStats: Record<string, { total: number; count: number }> = {}
      for (const r of (reviewsRes.data ?? [])) {
        if (!reviewStats[r.reviewee_id]) reviewStats[r.reviewee_id] = { total: 0, count: 0 }
        reviewStats[r.reviewee_id].total += r.score
        reviewStats[r.reviewee_id].count += 1
      }
      // 빠른응답 인증 — 공급자별 병렬 조회 (RPC)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fastResRes = await Promise.all(
        (supplierIds as string[]).map((id) =>
          (supabase as any).rpc('is_fast_responder', { p_supplier_id: id, p_days: 30 })
        )
      )
      const fastResMap: Record<string, boolean> = {}
      ;(supplierIds as string[]).forEach((id, i) => {
        fastResMap[id] = fastResRes[i]?.data === true
      })

      for (const p of (profilesRes.data ?? [])) {
        const stats = reviewStats[p.user_id]
        supplierMap[p.user_id] = {
          company_name: p.company_name,
          plan:         p.plan,
          avg_score:    stats ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
          review_count: stats?.count ?? 0,
          origin:       p.origin ?? 'domestic',
          country:      p.country ?? null,
          overseas_supply_type: p.overseas_supply_type ?? null,
          or_type:      p.or_type ?? null,
          tier:         p.referral_tier ?? null,
          fast_responder: !!fastResMap[p.user_id],
        }
      }

      // bidItemsMap 구성
      for (const row of (bidItemsRes.data ?? [])) {
        if (!bidItemsMap[row.bid_id]) bidItemsMap[row.bid_id] = []
        bidItemsMap[row.bid_id].push(row)
      }

      // verificationMap 구성
      for (const v of (verificationsRes.data ?? [])) {
        verificationMap[v.bid_id] = {
          id:       v.id,
          status:   v.status,
          filePath: v.file_path,
          fileName: v.file_name,
          fileSize: v.file_size,
        }
      }

      // submitted 상태 자료의 signed URL 생성 (admin client 사용)
      const admin = createAdminClient()
      for (const [bidId, v] of Object.entries(verificationMap)) {
        if (v.status === 'submitted' && v.filePath) {
          const { data: signed } = await admin.storage
            .from('bid-verifications')
            .createSignedUrl(v.filePath, 7 * 24 * 60 * 60) // 7일
          if (signed?.signedUrl) signedUrlMap[bidId] = signed.signedUrl
        }
      }

      // 입찰 첨부 견적 PDF 상태 — 다운로드 라우트를 통해 그 자리에서 받고 24h 후 삭제
      for (const b of bids) {
        if (b.quote_file_path) {
          quoteMap[b.id] = {
            name:         b.quote_file_name ?? null,
            size:         b.quote_file_size ?? null,
            downloadedAt: b.quote_downloaded_at ?? null,
            deletedAt:    b.quote_deleted_at ?? null,
          }
        }
      }
    }
  }

  function getBidTotal(bidId: string): number {
    return (bidItemsMap[bidId] ?? [])
      .filter((i: any) => i.available)
      .reduce((s: number, i: any) => s + (i.total_price ?? 0), 0)
  }

  const sortedBidsAll = [...bids].sort((a, b) => getBidTotal(a.id) - getBidTotal(b.id))
  function passFilter(b: any): boolean {
    const s = supplierMap[b.supplier_id]
    if (filter === 'tier') return !!s?.tier
    if (filter === 'fast') return !!s?.fast_responder
    if (filter === 'safe') return !!s?.tier && !!s?.fast_responder
    return true
  }
  const sortedBids = filter === 'all' ? sortedBidsAll : sortedBidsAll.filter(passFilter)
  const filterCounts = {
    all:  sortedBidsAll.length,
    tier: sortedBidsAll.filter(b => !!supplierMap[b.supplier_id]?.tier).length,
    fast: sortedBidsAll.filter(b => !!supplierMap[b.supplier_id]?.fast_responder).length,
    safe: sortedBidsAll.filter(b => !!supplierMap[b.supplier_id]?.tier && !!supplierMap[b.supplier_id]?.fast_responder).length,
  }

  // 단건 모드: 각 입찰의 수락/자료요청 버튼 영역
  function BidActions({ bid, isAccepted }: { bid: any; isAccepted: boolean }) {
    if (request.status !== 'open' || isAccepted) return null

    const veri    = verificationMap[bid.id]
    const baseBtn = 'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold shadow transition-colors disabled:opacity-60'

    // 자료 검토 필요 — submitted
    if (veri?.status === 'submitted') {
      const signedUrl = signedUrlMap[bid.id]
      return (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <VeriBadge status="submitted" />
          {/* 파일 다운로드 */}
          {signedUrl && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
            >
              <FileSearch className="h-3.5 w-3.5" />
              {veri.fileName ?? '파일 다운로드'}
              {veri.fileSize && (
                <span className="text-muted-foreground no-underline ml-1">
                  ({(veri.fileSize / 1024).toFixed(0)} KB)
                </span>
              )}
            </a>
          )}
          {/* 수락 / 반려 */}
          <div className="flex gap-2 flex-wrap">
            <form action={reviewVerification}>
              <input type="hidden" name="verificationId" value={veri.id} />
              <input type="hidden" name="bidId"          value={bid.id} />
              <input type="hidden" name="requestId"      value={params.id} />
              <input type="hidden" name="action"         value="accept" />
              <SubmitButton pendingText="처리 중…" className={cn(baseBtn, 'bg-primary text-primary-foreground hover:bg-primary/90')}>
                ✅ 수락 (낙찰 확정)
              </SubmitButton>
            </form>
            <form action={reviewVerification}>
              <input type="hidden" name="verificationId" value={veri.id} />
              <input type="hidden" name="bidId"          value={bid.id} />
              <input type="hidden" name="requestId"      value={params.id} />
              <input type="hidden" name="action"         value="reject" />
              <SubmitButton pendingText="처리 중…" className={cn(baseBtn, 'border border-border bg-background hover:bg-muted')}>
                반려
              </SubmitButton>
            </form>
          </div>
        </div>
      )
    }

    // 자료 대기 중 — requested
    if (veri?.status === 'requested') {
      return (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <VeriBadge status="requested" />
          <p className="text-xs text-muted-foreground">공급자가 자료를 업로드하면 이메일로 알림드립니다.</p>
          <form action={acceptBid.bind(null, bid.id, params.id)}>
            <SubmitButton pendingText="처리 중…" className={cn(baseBtn, 'border border-border bg-background hover:bg-muted text-muted-foreground')}>
              자료 없이 수락
            </SubmitButton>
          </form>
        </div>
      )
    }

    // 자료 반려됨 — rejected (재요청 or 그냥 수락 선택)
    if (veri?.status === 'rejected') {
      return (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <VeriBadge status="rejected" />
          <div className="flex gap-2 flex-wrap">
            <form action={acceptBid.bind(null, bid.id, params.id)}>
              <SubmitButton pendingText="처리 중…" className={cn(baseBtn, 'bg-primary text-primary-foreground hover:bg-primary/90')}>
                수락
              </SubmitButton>
            </form>
            <form action={requestVerification.bind(null, bid.id, params.id)}>
              <SubmitButton pendingText="요청 중…" className={cn(baseBtn, 'border border-border bg-background hover:bg-muted')}>
                재요청
              </SubmitButton>
            </form>
          </div>
        </div>
      )
    }

    // 기본: 자료 요청 없음
    return (
      <div className="flex flex-col items-end gap-2 shrink-0">
        <form action={acceptBid.bind(null, bid.id, params.id)}>
          <SubmitButton pendingText="처리 중…" className={cn(baseBtn, 'bg-primary text-primary-foreground hover:bg-primary/90')}>
            수락
          </SubmitButton>
        </form>
        <form action={requestVerification.bind(null, bid.id, params.id)}>
          <SubmitButton pendingText="요청 중…" className={cn(baseBtn, 'border border-border bg-background hover:bg-muted text-xs text-muted-foreground')}>
            자료 요청
          </SubmitButton>
        </form>
      </div>
    )
  }

  // 입찰 첨부 견적 PDF — 비교용 다운로드 + 24시간 후 서버 자동 삭제 안내
  function QuoteLink({ bidId }: { bidId: string }) {
    const q = quoteMap[bidId]
    if (!q) return null

    const TTL = 24 * 60 * 60 * 1000
    const downloadedMs = q.downloadedAt ? new Date(q.downloadedAt).getTime() : null
    // 삭제됨 또는 다운로드 후 24시간 경과 → 다운로드 완료(서버 삭제)
    const completed = !!q.deletedAt || (downloadedMs != null && Date.now() - downloadedMs > TTL)

    if (completed) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />
          견적서 다운로드 완료 — 서버에서 삭제됨
        </span>
      )
    }

    const downloaded = downloadedMs != null
    return (
      <div className="space-y-1">
        <a
          href={`/api/researcher/quote/${bidId}`}
          className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          견적서 PDF 다운로드 (비교용)
          {q.name && <span className="text-muted-foreground no-underline">— {q.name}</span>}
          {q.size != null && (
            <span className="text-muted-foreground no-underline">({(q.size / 1024).toFixed(0)} KB)</span>
          )}
        </a>
        <p className="text-[11px] text-amber-600 [word-break:keep-all]">
          {downloaded
            ? '📥 다운로드됨 — 보안을 위해 다운로드 후 24시간이 지나면 서버에서 자동 삭제됩니다.'
            : 'ℹ️ 비교용 견적서입니다. 다운로드 후 24시간 이내에 서버에서 자동 삭제됩니다.'}
        </p>
      </div>
    )
  }

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
        <InfoRow label="게시일"      value={new Date(request.created_at).toLocaleDateString('ko-KR')} />
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

      {/* 그룹 바이 안내 */}
      {groupBuyPeers && groupBuyPeers.researcherCount > 0 && (
        <section className="mb-4">
          <GroupBuyBanner
            researcherCount={groupBuyPeers.researcherCount}
            requestCount={groupBuyPeers.requestCount}
            totalQty={groupBuyPeers.totalQty}
            unit={groupBuyPeers.unit}
          />
        </section>
      )}

      {/* 공급 이력 보유 공급자 */}
      {catalogSuppliers.length > 0 && firstItem && (
        <section className="mb-6">
          <CatalogSuppliers suppliers={catalogSuppliers} substanceName={firstItem.substance_name} />
        </section>
      )}

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

      {/* 견적 비교 섹션 */}
      {showBids && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-semibold">
              {isBatch ? '공급자별 견적 비교' : '견적 비교'}
              {request.status === 'open' && deadlinePassed && (
                <span className="ml-2 text-xs font-normal text-amber-600">마감됨 — 견적 선택 가능</span>
              )}
            </h2>
            {/* 필터 칩 */}
            {bids.length > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground mr-1">필터:</span>
                {([
                  { k: 'all',  l: '전체' },
                  { k: 'tier', l: '🏆 티어 있음' },
                  { k: 'fast', l: '⚡ 빠른응답' },
                  { k: 'safe', l: '✨ 추천 (티어+빠른응답)' },
                ] as const).map(c => (
                  <Link
                    key={c.k}
                    href={`/researcher/requests/${params.id}${c.k === 'all' ? '' : `?filter=${c.k}`}`}
                    className={cn(
                      'px-2.5 py-1 rounded-full border transition',
                      filter === c.k
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {c.l} <span className="opacity-70">({filterCounts[c.k]})</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {!bids.length ? (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              접수된 견적이 없습니다.
            </div>
          ) : isBatch ? (
            // ── 묶음 매트릭스 ────────────────────────────────────────────────
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-medium border-b border-r border-border">품목</th>
                      {sortedBids.map((bid, idx) => {
                        const s    = supplierMap[bid.supplier_id]
                        const veri = verificationMap[bid.id]
                        return (
                          <th key={bid.id} className="px-3 py-2.5 text-center font-medium border-b border-r border-border min-w-28">
                            <div>{s?.company_name ?? '—'}</div>
                            {idx === 0 && <div className="text-[10px] font-normal text-primary">최저가</div>}
                            {bid.is_partial && <div className="text-[10px] font-normal text-amber-600">부분견적</div>}
                            {veri && <div className="mt-0.5"><VeriBadge status={veri.status} /></div>}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(items ?? []).map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 border-r border-border">
                          <div className="font-medium">{item.substance_name}</div>
                          <div className="text-xs text-muted-foreground">{item.qty} {item.unit}</div>
                        </td>
                        {sortedBids.map(bid => {
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

              {/* 묶음 — 공급자별 수락/자료요청 버튼 */}
              {request.status === 'open' && sortedBids.length > 0 && (
                <div className="mt-4 space-y-3">
                  {sortedBids.map((bid, idx) => {
                    const s    = supplierMap[bid.supplier_id]
                    const veri = verificationMap[bid.id]
                    const total = getBidTotal(bid.id)
                    return (
                      <div key={bid.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{s?.company_name ?? '—'}</span>
                            {idx === 0 && <Badge className="text-xs">최저가</Badge>}
                            {veri && <VeriBadge status={veri.status} />}
                            {s?.origin === 'overseas' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold">
                                🌐 해외{s.country ? ` · ${s.country}` : ''}
                              </span>
                            )}
                            {s?.or_type && (
                              <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold">
                                {s.or_type === 'only_representative' ? '유일대리인' : '한국지사'}
                              </span>
                            )}
                            {bid.cert_responsibility_ack && (
                              <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold">
                                ⚠ KC·전기안전 공급사 책임
                              </span>
                            )}
                            {s?.tier && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-bold border"
                                style={{
                                  borderColor: s.tier === 'gold' ? '#D4AF37' : s.tier === 'silver' ? '#A8A8A8' : '#CD7F32',
                                  color:       s.tier === 'gold' ? '#D4AF37' : s.tier === 'silver' ? '#A8A8A8' : '#CD7F32',
                                  background:  s.tier === 'gold' ? '#D4AF3715' : s.tier === 'silver' ? '#A8A8A815' : '#CD7F3215',
                                }}
                                title={`${s.tier === 'gold' ? '100' : s.tier === 'silver' ? '30' : '10'}명+ 인증 연구자를 초대한 공급자`}
                              >
                                🏆 {s.tier === 'gold' ? 'Gold' : s.tier === 'silver' ? 'Silver' : 'Bronze'}
                              </span>
                            )}
                            {s?.fast_responder && (
                              <span
                                className="rounded-full bg-secondary/10 text-secondary border border-secondary/30 px-2 py-0.5 text-[11px] font-bold"
                                title="최근 30일 평균 응답 60분 이하 · 5건 이상"
                              >
                                ⚡ 빠른응답
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-primary">{total.toLocaleString()}원</span>
                        </div>

                        {/* 공급 조건 요약 — 납기/통관/데모/샘플 */}
                        {(bid.lead_time_days || bid.customs_duty_included !== null || bid.demo_available !== null || bid.sample_available !== null || bid.conditions_note) && (
                          <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            {bid.lead_time_days != null && (
                              <span>📦 예상 납기 <strong className="text-foreground">{bid.lead_time_days}일</strong>{s?.origin === 'overseas' ? ' (통관 포함)' : ''}</span>
                            )}
                            {bid.customs_duty_included !== null && (
                              <span>🛃 관세·부가세 {bid.customs_duty_included ? '포함' : '별도'}</span>
                            )}
                            {bid.demo_available !== null && (
                              <span>🔧 데모 {bid.demo_available ? `가능${bid.demo_days ? ` (${bid.demo_days}일)` : ''}` : '불가'}</span>
                            )}
                            {bid.sample_available !== null && (
                              <span>🧪 샘플 {bid.sample_available ? '제공' : '불가'}</span>
                            )}
                            {bid.conditions_note && (
                              <span className="basis-full">📝 {bid.conditions_note}</span>
                            )}
                          </div>
                        )}

                        {/* 입찰 첨부 견적 PDF — 공급사 양식 (수락 전 비교 다운로드) */}
                        {quoteMap[bid.id] && (
                          <div className="mb-2"><QuoteLink bidId={bid.id} /></div>
                        )}

                        {/* submitted: 파일 링크 + 수락/반려 */}
                        {veri?.status === 'submitted' && (
                          <div className="space-y-2">
                            {signedUrlMap[bid.id] && (
                              <a href={signedUrlMap[bid.id]} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-xs text-primary underline">
                                <FileSearch className="h-3 w-3" /> {veri.fileName}
                              </a>
                            )}
                            <div className="flex gap-2">
                              <form action={reviewVerification}>
                                <input type="hidden" name="verificationId" value={veri.id} />
                                <input type="hidden" name="bidId"          value={bid.id} />
                                <input type="hidden" name="requestId"      value={params.id} />
                                <input type="hidden" name="action"         value="accept" />
                                <SubmitButton pendingText="처리 중…" className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-60">
                                  ✅ 수락
                                </SubmitButton>
                              </form>
                              <form action={reviewVerification}>
                                <input type="hidden" name="verificationId" value={veri.id} />
                                <input type="hidden" name="bidId"          value={bid.id} />
                                <input type="hidden" name="requestId"      value={params.id} />
                                <input type="hidden" name="action"         value="reject" />
                                <SubmitButton pendingText="처리 중…" className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-60">
                                  반려
                                </SubmitButton>
                              </form>
                            </div>
                          </div>
                        )}

                        {/* 그 외 상태: 수락 + 자료요청 */}
                        {(!veri || veri.status === 'rejected') && (
                          <div className="flex gap-2 flex-wrap">
                            <form action={acceptBid.bind(null, bid.id, params.id)}>
                              <SubmitButton pendingText="처리 중…" className={cn(
                                'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold shadow transition-colors disabled:opacity-60',
                                idx === 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border bg-background hover:bg-muted'
                              )}>
                                {s?.company_name} 수락
                              </SubmitButton>
                            </form>
                            <form action={requestVerification.bind(null, bid.id, params.id)}>
                              <SubmitButton pendingText="요청 중…" className="inline-flex items-center justify-center rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60">
                                {veri?.status === 'rejected' ? '재요청' : '자료 요청'}
                              </SubmitButton>
                            </form>
                          </div>
                        )}

                        {veri?.status === 'requested' && (
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-amber-600">⏳ 자료 대기 중 — 공급자가 제출하면 이메일로 알림</p>
                            <form action={acceptBid.bind(null, bid.id, params.id)}>
                              <SubmitButton pendingText="처리 중…" className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60">
                                자료 없이 수락
                              </SubmitButton>
                            </form>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            // ── 단건 목록 ──────────────────────────────────────────────────────
            <div className="flex flex-col gap-3">
              {sortedBids.map((bid, idx) => {
                const s          = supplierMap[bid.supplier_id]
                const total      = getBidTotal(bid.id)
                const isAccepted = bid.status === 'accepted'
                const isLowest   = idx === 0

                return (
                  <div
                    key={bid.id}
                    className={cn(
                      'rounded-lg border p-4',
                      isAccepted ? 'border-primary bg-primary/5' : isLowest ? 'border-primary/40' : 'border-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* 좌측: 회사 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold">{s?.company_name ?? '—'}</span>
                          {isLowest && !isAccepted && <Badge className="text-xs">최저가</Badge>}
                          {isAccepted && (
                            <Badge className="text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" /> 낙찰
                            </Badge>
                          )}
                          {!isAccepted && verificationMap[bid.id] && (
                            <VeriBadge status={verificationMap[bid.id].status} />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {bid.delivery_date && <span>납기 {bid.delivery_date}</span>}
                          {s && s.review_count > 0 && <span>⭐ {s.avg_score} ({s.review_count}건)</span>}
                          {bid.is_partial && <span className="text-amber-600">부분견적</span>}
                        </div>
                        {bid.memo && <p className="mt-1.5 text-xs text-muted-foreground">{bid.memo}</p>}
                        <div className="mt-2"><QuoteLink bidId={bid.id} /></div>
                      </div>

                      {/* 우측: 가격 + 수락 버튼 (기본 상태 or accepted) */}
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-primary mb-2">{total.toLocaleString()}원</div>
                        {/* submitted/requested/rejected는 아래 BidActions에서 처리 */}
                        {request.status === 'open' && !isAccepted && !verificationMap[bid.id] && (
                          <BidActions bid={bid} isAccepted={isAccepted} />
                        )}
                      </div>
                    </div>

                    {/* 자료 요청이 있는 경우: 전체 폭 액션 영역 */}
                    {request.status === 'open' && !isAccepted && verificationMap[bid.id] && (
                      <BidActions bid={bid} isAccepted={isAccepted} />
                    )}
                  </div>
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
