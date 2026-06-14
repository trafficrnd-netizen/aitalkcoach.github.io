import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { PlusCircle, FileText, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ReqStatus = 'open' | 'closed'

interface RequestRow {
  id: string
  title: string
  created_at: string
  deadline: string | null
  status: ReqStatus
  bid_mode: string
  bidCount: number
}

function StatusBadge({ status, bidCount }: { status: ReqStatus; bidCount: number }) {
  if (status === 'closed') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">낙찰 완료</span>
    )
  }
  if (bidCount > 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
        입찰 {bidCount}건
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">대기 중</span>
  )
}

export default async function MediRequestsPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()

  let list: RequestRow[] = []

  if (user) {
    const { data: requests } = await db
      .from('requests')
      .select('id, title, created_at, deadline, status, bid_mode, vertical')
      .eq('researcher_id', user.id)
      .eq('vertical', 'aesthetic')
      .order('created_at', { ascending: false })
      .limit(50)

    if (requests?.length) {
      const ids: string[] = requests.map((r: { id: string }) => r.id)
      const { data: bidRows } = await db
        .from('bids')
        .select('request_id')
        .in('request_id', ids)

      const bidCountMap: Record<string, number> = {}
      for (const b of (bidRows ?? [])) {
        bidCountMap[b.request_id] = (bidCountMap[b.request_id] ?? 0) + 1
      }

      list = requests.map((r: { id: string; title: string; created_at: string; deadline: string | null; status: ReqStatus; bid_mode: string }) => ({
        ...r,
        bidCount: bidCountMap[r.id] ?? 0,
      }))
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 요청 목록</h1>
        <Link href="/clinic/request" className={buttonVariants({ size: 'sm', className: 'gap-1' })}>
          <PlusCircle className="h-4 w-4" /> 새 요청
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">등록된 요청이 없습니다.</p>
          <Link href="/clinic/request" className={buttonVariants({ size: 'sm', className: 'mt-4' })}>
            첫 견적 요청하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((req) => (
            <li key={req.id}>
              <Link
                href={`/clinic/requests/${req.id}`}
                className={cn(
                  'flex items-center justify-between rounded-lg border border-border bg-background p-4',
                  'hover:border-primary/40 hover:bg-muted/30 transition-colors'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{req.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(req.created_at).toLocaleDateString('ko-KR')}
                    {' · '}
                    {req.bid_mode === 'open' ? '상시 입찰' : '마감 입찰'}
                    {req.deadline && ` · 마감 ${new Date(req.deadline).toLocaleDateString('ko-KR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <StatusBadge status={req.status} bidCount={req.bidCount} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
