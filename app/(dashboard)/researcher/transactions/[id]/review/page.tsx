import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { submitReview } from '@/lib/actions/transaction'
import { buttonVariants } from '@/components/ui/button'
import { StarRatingGroup } from '@/components/star-rating-group'

export default async function ResearcherReviewPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { reviewee?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const revieweeId = searchParams.reviewee ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tx } = await (supabase as any)
    .from('transactions')
    .select('id, request_id, status')
    .eq('id', params.id)
    .single()
  if (!tx || tx.status !== 'completed') notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from('requests')
    .select('title, researcher_id')
    .eq('id', tx.request_id)
    .eq('researcher_id', user.id)
    .single()
  if (!req) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('transaction_id', params.id)
    .eq('reviewer_id', user.id)
  if (Number(count) > 0) redirect('/researcher/requests')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sp } = revieweeId ? await (supabase as any)
    .from('supplier_profiles').select('company_name').eq('user_id', revieweeId).single() : { data: null }

  return (
    <div className="max-w-lg">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">⭐</div>
        <h1 className="text-2xl font-bold mb-2">공급자 거래 평가</h1>
        <p className="text-sm text-muted-foreground">
          <strong>{sp?.company_name ?? '공급자'}</strong>와의 거래 경험을 평가해주세요.
        </p>
        <p className="text-xs text-muted-foreground mt-1">{req.title}</p>
      </div>

      <form action={submitReview} className="space-y-6">
        <input type="hidden" name="transactionId" value={params.id} />
        <input type="hidden" name="revieweeId" value={revieweeId} />
        <input type="hidden" name="reviewerRole" value="researcher" />

        <div className="rounded-lg border border-border p-5">
          <StarRatingGroup
            dimensions={[
              { name: 'score',               label: '종합 만족도',   required: true },
              { name: 'price_score',          label: '가격 만족도',   required: false },
              { name: 'delivery_score',       label: '납기 준수',     required: false },
              { name: 'communication_score',  label: '커뮤니케이션',  required: false },
            ]}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">상세 평가 (선택)</label>
          <textarea
            name="comment"
            rows={3}
            placeholder="품질, 포장 상태, 응대 속도, 재구매 의향 등 솔직한 평가를 남겨주세요."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          평가 내용은 공급자 프로필에 누적되어 다른 연구자의 공급자 선택에 도움이 됩니다.
        </p>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            평가 제출
          </button>
          <Link href="/researcher/requests" className={buttonVariants({ variant: 'outline' })}>
            건너뛰기
          </Link>
        </div>
      </form>
    </div>
  )
}
