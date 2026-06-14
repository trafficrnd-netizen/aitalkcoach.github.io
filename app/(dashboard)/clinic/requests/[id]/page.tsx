/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, MapPin, ShieldCheck, ShieldAlert, Shield } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Badge } from '@/components/ui/badge'
import { acceptMediBid } from '@/lib/actions/medi-accept'
import { getServerT } from '@/lib/i18n/server'
import { cn } from '@/lib/utils'

const ITEM_TYPE_LABELS: Record<string, string> = {
  device: '미용기기 소모품',
  supply: '시술 부자재',
  cosmetic: '관리실 화장품',
}

// 의료기기 인증 배지
function CertBadge({ status }: { status: string | null }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <ShieldCheck className="h-3 w-3" /> 의료기기 인증
    </span>
  )
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-700">
      <ShieldAlert className="h-3 w-3" /> 인증 심사 중
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
      <Shield className="h-3 w-3" /> 미인증
    </span>
  )
}

export default async function ClinicRequestDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 요청 조회 (의원 소유 + aesthetic)
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('id, title, deadline, delivery_city, notes, item_type, status, created_at, vertical')
    .eq('id', params.id)
    .eq('researcher_id', user.id)
    .eq('vertical', 'aesthetic')
    .single()
  if (!request) notFound()

  // 마감 전 봉인: 납기 전이고 open이면 bid 금액 숨김
  const deadlinePassed = request.deadline ? new Date(request.deadline) < new Date() : true
  const isClosed = request.status === 'closed'
  const showBids = deadlinePassed || isClosed

  // 입찰 수 (항상 표시)
  const { count: bidCount } = await (supabase as any)
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', params.id)

  let bids: any[] = []
  const supplierMap: Record<string, { company_name: string; cert_status: string | null }> = {}

  if (showBids) {
    const { data: rawBids } = await (supabase as any)
      .from('bids')
      .select('id, supplier_id, delivery_date, memo, status, created_at')
      .eq('request_id', params.id)
      .order('created_at', { ascending: true })
    bids = rawBids ?? []

    if (bids.length > 0) {
      const supplierIds = bids.map((b: any) => b.supplier_id)

      // 공급사 프로필 + 인증 상태 병렬 조회
      const [profilesRes, certsRes] = await Promise.all([
        (supabase as any)
          .from('supplier_profiles')
          .select('user_id, company_name')
          .in('user_id', supplierIds),
        (supabase as any)
          .from('supplier_certifications')
          .select('supplier_id, status')
          .in('supplier_id', supplierIds)
          .eq('vertical', 'aesthetic')
          .eq('cert_type', 'med_device'),
      ])

      // cert_status map: supplier_id → status
      const certMap: Record<string, string> = {}
      for (const c of (certsRes.data ?? [])) {
        certMap[c.supplier_id] = c.status
      }

      for (const p of (profilesRes.data ?? [])) {
        supplierMap[p.user_id] = {
          company_name: p.company_name,
          cert_status: certMap[p.user_id] ?? null,
        }
      }
    }
  }

  // 입찰 금액 조회 (bid_items)
  const bidItemsMap: Record<string, number> = {}
  if (bids.length > 0) {
    const bidIds = bids.map((b: any) => b.id)
    const { data: bidItems } = await (supabase as any)
      .from('bid_items')
      .select('bid_id, total_price, available')
      .in('bid_id', bidIds)
    for (const item of (bidItems ?? [])) {
      if (item.available) {
        bidItemsMap[item.bid_id] = (bidItemsMap[item.bid_id] ?? 0) + item.total_price
      }
    }
  }

  // 가격순 정렬
  const sortedBids = [...bids].sort((a, b) => (bidItemsMap[a.id] ?? 0) - (bidItemsMap[b.id] ?? 0))

  const daysLeft = request.deadline
    ? Math.ceil((new Date(request.deadline).getTime() - Date.now()) / 86_400_000)
    : null
  const itemLabel = ITEM_TYPE_LABELS[request.item_type ?? ''] ?? ''
  const acceptedBid = bids.find((b: any) => b.status === 'accepted')

  return (
    <div className="max-w-2xl">
      <Link
        href="/clinic/requests"
        className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mb-5 gap-1' })}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('medi.compare.back')}
      </Link>

      {/* 요청 정보 */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {itemLabel && <Badge variant="secondary">{itemLabel}</Badge>}
          <Badge
            className={cn(
              'border-0',
              isClosed ? 'bg-emerald-100 text-emerald-700'
              : 'bg-primary/10 text-primary'
            )}
          >
            {isClosed ? t('medi.compare.statusClosed') : t('medi.compare.statusOpen')}
          </Badge>
        </div>
        <h1 className="text-xl font-bold mb-3">{request.title}</h1>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {request.delivery_city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{request.delivery_city}</span>
            </div>
          )}
          {daysLeft !== null && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                {daysLeft > 0
                  ? `납기 D-${daysLeft}`
                  : daysLeft === 0
                  ? '오늘 마감'
                  : '마감'}
              </span>
            </div>
          )}
          {request.notes && (
            <p className="mt-1 text-xs whitespace-pre-wrap">{request.notes}</p>
          )}
        </div>
      </div>

      {/* 입찰 섹션 */}
      <div>
        <h2 className="font-semibold text-base mb-3">
          {t('medi.compare.bidsTitle')}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {t('medi.compare.bidCount').replace('{n}', String(bidCount ?? 0))}
          </span>
        </h2>

        {/* 봉인 상태 안내 */}
        {!showBids && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm mb-4">
            <div className="flex items-center gap-2 text-primary font-medium mb-1">
              <Clock className="h-4 w-4" />
              {t('medi.compare.sealed')}
            </div>
            <p className="text-muted-foreground text-xs">{t('medi.compare.sealedHint')}</p>
          </div>
        )}

        {/* 낙찰 완료 배너 */}
        {isClosed && acceptedBid && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium text-emerald-700">
              {t('medi.compare.accepted').replace(
                '{company}',
                supplierMap[acceptedBid.supplier_id]?.company_name ?? '—'
              )}
            </span>
          </div>
        )}

        {showBids && sortedBids.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {t('medi.compare.noBids')}
          </div>
        )}

        {showBids && sortedBids.length > 0 && (
          <div className="space-y-3">
            {sortedBids.map((bid: any, idx: number) => {
              const supplier = supplierMap[bid.supplier_id]
              const total = bidItemsMap[bid.id] ?? 0
              const isAccepted = bid.status === 'accepted'
              const isLowest = idx === 0 && !isClosed
              const certStatus = supplier?.cert_status ?? null

              return (
                <div
                  key={bid.id}
                  className={cn(
                    'rounded-xl border px-4 py-4',
                    isAccepted
                      ? 'border-emerald-300 bg-emerald-50'
                      : isLowest
                      ? 'border-primary/40 bg-card'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* 좌측: 공급사 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-semibold text-sm">
                          {supplier?.company_name ?? '—'}
                        </span>
                        {isAccepted && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('medi.compare.acceptedBadge')}
                          </Badge>
                        )}
                        {isLowest && (
                          <Badge className="text-[11px]">{t('medi.compare.lowest')}</Badge>
                        )}
                        <CertBadge status={certStatus} />
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                        {bid.delivery_date && (
                          <span>{t('medi.compare.delivery')}: {bid.delivery_date}</span>
                        )}
                        {bid.memo && (
                          <span className="line-clamp-1">{bid.memo}</span>
                        )}
                      </div>
                    </div>

                    {/* 우측: 가격 + 수락 버튼 */}
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-primary mb-2">
                        {total > 0 ? `${total.toLocaleString()}원` : '—'}
                      </p>
                      {request.status === 'open' && !isAccepted && (
                        <form action={acceptMediBid.bind(null, bid.id, params.id)}>
                          <SubmitButton
                            pendingText={t('medi.compare.accepting')}
                            className={cn(
                              'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold shadow transition-colors disabled:opacity-60',
                              isLowest
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'border border-border bg-background hover:bg-muted'
                            )}
                          >
                            {t('medi.compare.accept')}
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
      </div>
    </div>
  )
}
