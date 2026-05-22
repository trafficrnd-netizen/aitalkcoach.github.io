/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect }       from 'next/navigation'
import Link               from 'next/link'
import { createClient }   from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft, FileCheck, AlertCircle } from 'lucide-react'
import { VerifyForm }     from './verify-form'

export default async function SupplierVerifyPage({ params }: { params: { bidId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 자료 제출 요청 조회
  const { data: verification } = await (supabase as any)
    .from('bid_verifications')
    .select('id, status, request_id, requested_at')
    .eq('bid_id',      params.bidId)
    .eq('supplier_id', user.id)
    .single()

  if (!verification || verification.status !== 'requested') redirect('/supplier/bids')

  // 요청 정보 + 품목 (병렬)
  const [requestRes, itemsRes] = await Promise.all([
    (supabase as any).from('requests').select('title, type').eq('id', verification.request_id).single(),
    (supabase as any).from('request_items')
      .select('substance_name, cas_number, qty, unit, purity')
      .eq('request_id', verification.request_id),
  ])

  const request = requestRes.data
  const items   = itemsRes.data ?? []

  return (
    <div className="max-w-lg">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/supplier/bids" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 내 입찰
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <FileCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">진위성 자료 제출</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        연구자가 공급 가능 여부를 확인할 수 있는 자료를 요청했습니다.
        자료 제출 후 검토를 거쳐 낙찰이 확정됩니다.
      </p>

      {/* 요청된 스펙 */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-5">
        <p className="font-semibold text-sm mb-2">📦 견적 요청 정보</p>
        <p className="font-medium mb-2">{request?.title ?? '—'}</p>
        {items.length > 0 && (
          <ul className="space-y-1">
            {items.map((item: any, i: number) => (
              <li key={i} className="text-sm text-muted-foreground flex flex-wrap gap-1.5">
                <span className="text-foreground font-medium">• {item.substance_name}</span>
                <span>{item.qty} {item.unit}</span>
                {item.purity     && <span className="text-xs">(순도 {item.purity})</span>}
                {item.cas_number && <span className="font-mono text-xs text-muted-foreground">CAS {item.cas_number}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 제출 가능한 자료 안내 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">제출 가능한 자료 예시</p>
        </div>
        <ul className="space-y-0.5 text-xs text-amber-700">
          <li>• 제품 사양서 (Spec Sheet)</li>
          <li>• 성적서 / 분석증명서 (COA, Certificate of Analysis)</li>
          <li>• 재고 현황 확인서 또는 캡처</li>
          <li>• 제조사 공급 가능 확인서</li>
          <li>• 기타 공급 가능성을 증빙하는 자료</li>
        </ul>
      </div>

      {/* 업로드 폼 — Client Component (useActionState로 에러 표시) */}
      <VerifyForm bidId={params.bidId} />

      <p className="mt-4 text-xs text-center text-muted-foreground">
        제출된 자료는 이 요청의 연구자에게만 공개되며, 낙찰 여부 결정에만 사용됩니다.
      </p>
    </div>
  )
}
