import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Sparkles, PlusCircle, FileText } from 'lucide-react'

export default async function MediDashboardPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()

  let requestCount = 0
  if (user) {
    const { count } = await db
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('researcher_id', user.id)
      .eq('vertical', 'aesthetic')
    requestCount = count ?? 0
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">BidVibe Medi 대시보드</h1>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">전액 무료</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/medi/request"
          className={buttonVariants({ size: 'lg', className: 'h-auto flex-col py-4 gap-1' })}
        >
          <PlusCircle className="h-6 w-6" />
          <span className="font-semibold">소모품 견적 요청</span>
          <span className="text-[11px] opacity-80">카트리지·니들·화장품 등</span>
        </Link>
        <Link
          href="/medi/requests"
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-auto flex-col py-4 gap-1' })}
        >
          <FileText className="h-6 w-6" />
          <span className="font-semibold">내 요청 목록</span>
          <span className="text-[11px] text-muted-foreground">총 {requestCount}건</span>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 요청을 등록하면 인증된 공급사들이 견적을 제출합니다. 수수료 없이 무료로 비교·선택하세요.
      </p>
    </div>
  )
}
