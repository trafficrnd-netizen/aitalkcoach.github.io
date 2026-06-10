import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { BatchBidForm } from '@/components/batch-bid-form'
import { SingleBidForm } from '@/components/single-bid-form'
import { maskCityOnly } from '@/lib/utils'
import { paymentTermLabel } from '@/lib/payment-terms'

export default async function BidPage({ params }: { params: { requestId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplier } = await (supabase as any)
    .from('supplier_profiles')
    .select('company_name, plan, origin, overseas_supply_type, country')
    .eq('user_id', user.id)
    .single()
  if (!supplier) redirect('/signup/supplier')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('id, title, type, status, deadline, delivery_address, delivery_city, payment_terms, notes')
    .eq('id', params.requestId)
    .eq('status', 'open')
    .single()
  if (!request) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: alreadyBidCount } = await (supabase as any)
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', params.requestId)
    .eq('supplier_id', user.id)
  const alreadyBid = Number(alreadyBidCount) > 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from('request_items')
    .select('id, substance_name, cas_number, qty, unit, purity, volume, item_type')
    .eq('request_id', params.requestId)

  const isBatch = request.type === 'batch'

  // 요청 품목 카테고리 분석 — 조건부 필수 입력 결정
  const itemTypes: string[] = (items ?? []).map((i: { item_type?: string }) => i.item_type ?? 'reagent')
  const hasEquipment = itemTypes.includes('equipment')
  const hasReagentOrBio = itemTypes.some(t => t === 'reagent' || t === 'bio')

  // 공급사 소재지 — 해외면 조건(납기·통관·인증) 명시 필수
  const isOverseas = supplier.origin === 'overseas'

  const bidContext = { hasEquipment, hasReagentOrBio, isOverseas }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/supplier/marketplace" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 입찰 광장
        </Link>
        <Badge variant="outline">{isBatch ? '묶음' : '단건'}</Badge>
      </div>

      <h1 className="text-2xl font-bold mb-2">{request.title}</h1>
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-6">
        {request.deadline && <span>마감 {new Date(request.deadline).toLocaleDateString('ko-KR')}</span>}
        {request.delivery_city && (
          <span className="font-medium text-foreground" title="대리점 권역 판단용 — 견적 가능 지역인지 확인하세요">
            🗺️ {request.delivery_city}
          </span>
        )}
        {request.payment_terms && (
          <span title="연구자가 선택한 결제조건">
            💳 {paymentTermLabel(request.payment_terms)}
          </span>
        )}
        {request.delivery_address && (
          <span title="낙찰 후 상세 주소가 공개됩니다">
            📍 {maskCityOnly(request.delivery_address)}
            <span className="ml-1 text-xs opacity-60">(상세주소 낙찰 후)</span>
          </span>
        )}
      </div>

      {request.notes && (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-sm mb-6">
          <span className="text-muted-foreground mr-2">요청사항:</span>{request.notes}
        </div>
      )}

      {alreadyBid ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <div className="text-3xl mb-3">✓</div>
          <p className="font-semibold text-lg mb-1">이미 입찰하셨습니다</p>
          <p className="text-sm text-muted-foreground mb-4">이 요청에 대한 견적을 이미 제출하셨습니다.</p>
          <Link href="/supplier/bids" className={buttonVariants({ variant: 'outline' })}>
            내 입찰 현황 보기
          </Link>
        </div>
      ) : isBatch ? (
        <>
          <h2 className="font-semibold mb-4">묶음 견적 제출</h2>
          <BatchBidForm requestId={params.requestId} items={items ?? []} requestTitle={request.title} bidContext={bidContext} />
        </>
      ) : (
        <>
          <h2 className="font-semibold mb-4">견적 제출</h2>
          <SingleBidForm requestId={params.requestId} items={items ?? []} bidContext={bidContext} />
        </>
      )}
    </div>
  )
}
