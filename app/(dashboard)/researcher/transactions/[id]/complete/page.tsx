import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, PackageCheck } from 'lucide-react'
import { completeTransaction } from '@/lib/actions/transaction'

export default async function CompleteTransactionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tx } = await (supabase as any)
    .from('transactions')
    .select('id, request_id, bid_id, status')
    .eq('id', params.id)
    .single()
  if (!tx || tx.status !== 'in_progress') notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (supabase as any)
    .from('requests')
    .select('title, researcher_id, deadline')
    .eq('id', tx.request_id)
    .eq('researcher_id', user.id)
    .single()
  if (!request) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bid } = await (supabase as any)
    .from('bids')
    .select('supplier_id, delivery_date, memo')
    .eq('id', tx.bid_id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplier } = bid ? await (supabase as any)
    .from('supplier_profiles')
    .select('company_name')
    .eq('user_id', bid.supplier_id)
    .single() : { data: null }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href={`/researcher/requests/${tx.request_id}`}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> 요청 상세
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <PackageCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">거래 완료 신고</h1>
          <p className="text-sm text-muted-foreground">납품이 완료되었음을 확인합니다</p>
        </div>
      </div>

      {/* 거래 요약 */}
      <div className="rounded-lg border border-border divide-y divide-border mb-6">
        <div className="flex gap-4 px-4 py-3">
          <span className="w-24 shrink-0 text-sm text-muted-foreground">요청</span>
          <span className="text-sm font-medium">{request.title}</span>
        </div>
        {supplier && (
          <div className="flex gap-4 px-4 py-3">
            <span className="w-24 shrink-0 text-sm text-muted-foreground">공급자</span>
            <span className="text-sm">{supplier.company_name}</span>
          </div>
        )}
        {bid?.delivery_date && (
          <div className="flex gap-4 px-4 py-3">
            <span className="w-24 shrink-0 text-sm text-muted-foreground">약속 납기</span>
            <span className="text-sm">{bid.delivery_date}</span>
          </div>
        )}
        {bid?.memo && (
          <div className="flex gap-4 px-4 py-3">
            <span className="w-24 shrink-0 text-sm text-muted-foreground">공급자 메모</span>
            <span className="text-sm text-muted-foreground">{bid.memo}</span>
          </div>
        )}
      </div>

      <form action={completeTransaction} className="space-y-4">
        <input type="hidden" name="transactionId" value={params.id} />

        <div>
          <label className="text-sm font-medium mb-1.5 block">실제 납품일</label>
          <Input
            type="date"
            name="actualDelivery"
            max={new Date().toISOString().split('T')[0]}
            defaultValue={new Date().toISOString().split('T')[0]}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">실제로 납품받은 날짜를 선택하세요.</p>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          ⚠️ 완료 신고 후에는 취소할 수 없습니다. 실제 납품이 완료된 경우에만 신고해주세요.
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            완료 신고 및 평가하기
          </button>
          <Link
            href={`/researcher/requests/${tx.request_id}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  )
}
