import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  open: '입찰 중',
  closed: '마감',
  expired: '기간 만료',
  cancelled: '취소됨',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  closed: 'secondary',
  expired: 'outline',
  cancelled: 'outline',
}

export default async function ResearcherRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requests } = await (supabase as any)
    .from('requests')
    .select('id, title, type, status, deadline, created_at')
    .eq('researcher_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">내 요청 목록</h1>
          <p className="text-sm text-muted-foreground mt-0.5">총 {requests?.length ?? 0}건</p>
        </div>
        <Link href="/researcher/request" className={buttonVariants({ size: 'sm' })}>
          + 새 요청
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">아직 견적 요청이 없습니다.</p>
          <Link href="/researcher/request" className={buttonVariants()}>
            첫 견적 요청하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(requests as any[]).map((req) => (
            <li key={req.id}>
              <Link href={`/researcher/requests/${req.id}`} className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[req.status] ?? 'outline'}>
                    {STATUS_LABEL[req.status] ?? req.status}
                  </Badge>
                  <span className="font-medium">{req.title ?? '(제목 없음)'}</span>
                  <span className="text-xs text-muted-foreground">
                    {req.type === 'single' ? '단건' : '묶음'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {req.deadline
                    ? `마감 ${req.deadline}`
                    : new Date(req.created_at).toLocaleDateString('ko-KR')}
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
