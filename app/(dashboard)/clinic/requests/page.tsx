import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { PlusCircle, FileText } from 'lucide-react'

export default async function MediRequestsPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = user
    ? await db
        .from('requests')
        .select('id, title, created_at, bid_mode, vertical')
        .eq('researcher_id', user.id)
        .eq('vertical', 'aesthetic')
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const list = requests ?? []

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 요청 목록</h1>
        <Link href="/clinic/request" className={buttonVariants({ size: 'sm' })}>
          <PlusCircle className="h-4 w-4 mr-1" /> 새 요청
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
          {list.map((req: { id: string; title: string; created_at: string; bid_mode: string }) => (
            <li key={req.id} className="rounded-lg border border-border bg-background p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{req.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(req.created_at).toLocaleDateString('ko-KR')} · {req.bid_mode === 'open' ? '상시 입찰' : '마감 입찰'}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">진행 중</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
