import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Store, BookOpen, ChevronRight, ArrowRight, Settings } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export default async function SupplierDashboard() {
  const t = getServerT()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('supplier_profiles')
    .select('company_name, plan, categories, early_bird')
    .eq('user_id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: bidCount } = await (supabase as any)
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', user.id)

  const isNew = !bidCount || bidCount === 0
  const hasNoCategories = !profile?.categories || profile.categories.length === 0
  const companyName = profile?.company_name ?? t('sd.defaultName')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{t('sd.greeting').replace('{name}', companyName)}</h1>
      <p className="text-muted-foreground mb-8">{t('sd.subtitle')}</p>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard label={t('sd.statPlan')} value={profile?.plan ?? 'free'} capitalize />
        <StatCard label={t('sd.statBids')} value={String(bidCount ?? 0)} />
        <StatCard label={t('sd.statMonthlyWon')} value="0" />
      </div>

      {/* 프로필 미완성 경고 */}
      {hasNoCategories && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 flex items-start gap-3">
          <div className="text-amber-600 font-bold text-lg">!</div>
          <div>
            <div className="font-medium text-amber-800 text-sm">{t('sd.catWarnTitle')}</div>
            <p className="text-xs text-amber-700 mt-0.5">{t('sd.catWarnDesc')}</p>
            <Link
              href="/supplier/settings"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
            >
              <Settings className="h-3 w-3" /> {t('sd.catWarnCta')}
            </Link>
          </div>
        </div>
      )}

      {/* 얼리버드 뱃지 */}
      {profile?.early_bird && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-6 flex items-center gap-2 text-sm">
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">{t('sd.earlybirdBadge')}</span>
          <span className="text-muted-foreground">{t('sd.earlybirdDesc')}</span>
        </div>
      )}

      {/* 신규 유저 온보딩 */}
      {isNew && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 mb-6">
          <h2 className="font-bold text-lg mb-1">{t('sd.onboardTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t('sd.onboardDesc')}</p>
          <ol className="space-y-3 mb-6">
            <OnboardStep num={1} title={t('sd.step1Title')} desc={t('sd.step1Desc')} done={!hasNoCategories} />
            <OnboardStep num={2} title={t('sd.step2Title')} desc={t('sd.step2Desc')} done={false} />
            <OnboardStep num={3} title={t('sd.step3Title')} desc={t('sd.step3Desc')} done={false} />
          </ol>
          <div className="flex gap-3">
            <Link href="/supplier/marketplace" className={buttonVariants({ size: 'sm' })}>
              {t('sd.marketCta')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            <Link href="/supplier/guide" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <BookOpen className="mr-1 h-4 w-4" /> {t('sd.guideCta')}
            </Link>
          </div>
        </div>
      )}

      {/* 기존 유저 빠른 액션 */}
      {!isNew && (
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickAction
            href="/supplier/marketplace"
            icon={<Store className="h-5 w-5 text-primary" />}
            title={t('sd.market')}
            desc={t('sd.marketDesc')}
          />
          <QuickAction
            href="/supplier/guide"
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            title={t('sd.guideCta')}
            desc={t('sd.guideDesc')}
          />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${capitalize ? 'capitalize' : ''}`}>{value}</div>
    </div>
  )
}

function OnboardStep({ num, title, desc, done }: {
  num: number; title: string; desc: string; done: boolean
}) {
  return (
    <li className="flex items-start gap-3">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {done ? '✓' : num}
      </div>
      <div>
        <div className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>{title}</div>
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
