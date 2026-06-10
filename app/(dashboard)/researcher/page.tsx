import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { FlaskConical, BookOpen, ChevronRight, ArrowRight } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export default async function ResearcherDashboard() {
  const t = getServerT()
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
  const name = profile?.name ?? t('rd.defaultName')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{t('rd.greeting').replace('{name}', name)}</h1>
      <p className="text-muted-foreground mb-8">{t('rd.subtitle')}</p>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard label={t('rd.statOpen')} value={String(openCount ?? 0)} />
        <StatCard label={t('rd.statAll')} value={String(requestCount ?? 0)} />
        <StatCard label={t('rd.statDone')} value="0" />
      </div>

      {/* 신규 유저 온보딩 위젯 */}
      {isNew && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 mb-6">
          <h2 className="font-bold text-lg mb-1">{t('rd.onboardTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t('rd.onboardDesc')}</p>
          <ol className="space-y-3 mb-6">
            <OnboardStep num={1} title={t('rd.step1Title')} desc={t('rd.step1Desc')} done={false} />
            <OnboardStep num={2} title={t('rd.step2Title')} desc={t('rd.step2Desc')} done={false} />
            <OnboardStep num={3} title={t('rd.step3Title')} desc={t('rd.step3Desc')} done={false} />
          </ol>
          <div className="flex gap-3">
            <Link href="/researcher/request" className={buttonVariants({ size: 'sm' })}>
              {t('rd.firstQuoteCta')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            <Link href="/researcher/guide" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <BookOpen className="mr-1 h-4 w-4" /> {t('rd.guideCta')}
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
            title={t('rd.newQuote')}
            desc={t('rd.newQuoteDesc')}
          />
          <QuickAction
            href="/researcher/guide"
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            title={t('rd.guideCta')}
            desc={t('rd.guideDesc')}
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
