import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { FlaskConical, BookOpen, ChevronRight, ArrowRight } from 'lucide-react'

export default async function ResearcherDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('researcher_profiles')
    .select('name')
    .eq('user_id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: requestCount } = await (supabase as any)
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('researcher_id', user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: openCount } = await (supabase as any)
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('researcher_id', user.id)
    .eq('status', 'open')

  const isNew = !requestCount || requestCount === 0
  const name = profile?.name ?? '연구자'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">안녕하세요, {name}님</h1>
      <p className="text-muted-foreground mb-8">오늘도 최적 견적을 찾아보세요.</p>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard label="진행 중인 요청" value={String(openCount ?? 0)} />
        <StatCard label="전체 요청" value={String(requestCount ?? 0)} />
        <StatCard label="완료된 거래" value="0" />
      </div>

      {/* 신규 유저 온보딩 위젯 */}
      {isNew && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 mb-6">
          <h2 className="font-bold text-lg mb-1">BidVibe 시작하기</h2>
          <p className="text-sm text-muted-foreground mb-5">
            3단계로 첫 견적을 받아보세요. 연구자는 모든 기능이 무료입니다.
          </p>
          <ol className="space-y-3 mb-6">
            <OnboardStep
              num={1}
              title="물질 검색"
              desc="CAS 번호나 물질명을 입력하면 자동완성됩니다."
              done={false}
            />
            <OnboardStep
              num={2}
              title="견적 요청 게시"
              desc="수량·순도·납기를 입력하고 게시하면 공급자들이 입찰합니다."
              done={false}
            />
            <OnboardStep
              num={3}
              title="최적 견적 수락"
              desc="가격·납기·신뢰도를 비교해 최적 공급자를 선택합니다."
              done={false}
            />
          </ol>
          <div className="flex gap-3">
            <Link href="/researcher/request" className={buttonVariants({ size: 'sm' })}>
              첫 견적 요청하기 <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            <Link href="/researcher/guide" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <BookOpen className="mr-1 h-4 w-4" /> 사용 가이드
            </Link>
          </div>
        </div>
      )}

      {/* 기존 유저 빠른 액션 */}
      {!isNew && (
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickAction
            href="/researcher/request"
            icon={<FlaskConical className="h-5 w-5 text-primary" />}
            title="새 견적 요청"
            desc="단건 또는 묶음 견적을 요청합니다."
          />
          <QuickAction
            href="/researcher/guide"
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            title="사용 가이드"
            desc="묶음 요청, 견적 비교 방법을 확인합니다."
          />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  )
}

function OnboardStep({ num, title, desc, done }: {
  num: number; title: string; desc: string; done: boolean
}) {
  return (
    <li className="flex items-start gap-3">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {num}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  )
}

function QuickAction({ href, icon, title, desc }: {
  href: string; icon: React.ReactNode; title: string; desc: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:bg-muted/40 transition-colors group"
    >
      <div className="rounded-md bg-primary/10 p-2">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  )
}
