import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, FileText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MediBidForm } from '@/components/medi/medi-bid-form'
import { LinkPreview } from '@/components/medi/link-preview'
import { getServerT } from '@/lib/i18n/server'

const ITEM_TYPE_LABELS: Record<string, string> = {
  device: '미용기기 소모품',
  supply: '시술 부자재',
  cosmetic: '관리실 화장품',
}

export default async function MediBidPage({ params }: { params: { requestId: string } }) {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 공급사 확인
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplier } = await (supabase as any)
    .from('supplier_profiles')
    .select('company_name')
    .eq('user_id', user.id)
    .single()
  if (!supplier) redirect('/signup/medi-supplier')

  // aesthetic 요청 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('id, title, deadline, delivery_city, notes, item_type, item_specs, status, vertical')
    .eq('id', params.requestId)
    .eq('vertical', 'aesthetic')
    .single()
  if (!request) notFound()

  // 이미 입찰 여부
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: alreadyBidCount } = await (supabase as any)
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', params.requestId)
    .eq('supplier_id', user.id)
  const alreadyBid = Number(alreadyBidCount) > 0

  const daysLeft = request.deadline
    ? Math.ceil((new Date(request.deadline).getTime() - Date.now()) / 86_400_000)
    : null
  const itemLabel = ITEM_TYPE_LABELS[request.item_type ?? ''] ?? request.item_type ?? ''

  return (
    <div>
      <Link
        href="/medi-supplier/marketplace"
        className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mb-4 gap-1' })}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('medi.supplier.backToMarket')}
      </Link>

      <div className="grid gap-6 md:grid-cols-[1fr_380px]">
        {/* 요청 상세 */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card px-5 py-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {itemLabel && <Badge variant="secondary">{itemLabel}</Badge>}
              <Badge
                variant={request.status === 'open' ? 'default' : 'secondary'}
                className={request.status === 'open' ? 'bg-emerald-100 text-emerald-700 border-0' : ''}
              >
                {request.status === 'open' ? '접수중' : request.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold mb-3">{request.title}</h1>

            <div className="space-y-2 text-sm text-muted-foreground">
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
                    {daysLeft > 0 ? `납기까지 D-${daysLeft}` : daysLeft === 0 ? '오늘 마감' : '마감됨'}
                  </span>
                </div>
              )}
              {request.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap">{request.notes}</span>
                </div>
              )}
            </div>
            {request.item_specs?.product_url && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1.5">제품 상세페이지</p>
                <LinkPreview url={request.item_specs.product_url} readonly />
              </div>
            )}
          </div>
        </div>

        {/* 입찰 폼 */}
        <div className="rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="text-base font-semibold mb-4">{t('medi.bid.formTitle')}</h2>
          {alreadyBid ? (
            <div className="py-8 text-center text-muted-foreground space-y-3">
              <p className="font-medium text-foreground">{t('medi.bid.alreadyBid')}</p>
              <p className="text-sm">{t('medi.bid.alreadyBidHint')}</p>
              <Link href="/medi-supplier/bids" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                {t('medi.supplier.ctaBids')}
              </Link>
            </div>
          ) : request.status !== 'open' ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>{t('medi.bid.closed')}</p>
            </div>
          ) : (
            <MediBidForm requestId={request.id} requestTitle={request.title} />
          )}
        </div>
      </div>
    </div>
  )
}
