'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FlaskConical, Clock, TrendingDown, Lock, Package, ShieldCheck, BarChart3, Megaphone, Construction } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WaitlistForm } from '@/components/waitlist-form'
import { HowItWorks } from '@/components/how-it-works'
import { useT } from '@/lib/i18n/context'

export default function LandingPage() {
  const t = useT()
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-14 text-center sm:py-20"
        style={{ background: 'radial-gradient(ellipse 80% 55% at 50% -10%, hsl(220 47% 22% / 0.10) 0%, transparent 70%)' }}
      >
        <div className="container px-5">
          <Badge variant="secondary" className="mb-4">{t('land.betaBadge')}</Badge>
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight [word-break:keep-all] sm:text-5xl md:text-6xl">
            {t('land.heroTitle1')}{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('land.heroTitle2')}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground [word-break:keep-all] sm:mt-6 sm:text-xl">
            <span className="block">{t('land.heroSub1')}</span>
            <span className="block">{t('land.heroSub2')}</span>
          </p>

          {/* CTA 버튼 블록 — 히어로와 시각적으로 분리 */}
          <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-border/70 bg-card/70 px-6 py-6 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/signup/researcher"
                className={cn(buttonVariants({ size: 'lg' }), 'w-full gap-2 px-7 text-base sm:w-auto')}
              >
                {t('land.ctaResearcher')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup/supplier"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'w-full gap-2 px-7 text-base sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors'
                )}
              >
                {t('land.ctaSupplier')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 text-xs sm:flex-row sm:gap-4">
              <span className="font-medium text-primary [word-break:keep-all]">{t('land.heroNoteR')}</span>
              <span className="hidden text-muted-foreground sm:inline">·</span>
              <span className="font-medium text-amber-600 [word-break:keep-all]">{t('land.heroNoteS')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 소셜 프루프 숫자 스트립 ─── */}
      <section aria-label="서비스 주요 지표" className="overflow-hidden pb-10 sm:pb-12" style={{ background: '#1E2F52' }}>
        {/* Wave top: 오트밀 히어로 → 네이비 */}
        <svg viewBox="0 0 1440 52" preserveAspectRatio="none" aria-hidden="true" className="block w-full" style={{ height: '52px' }}>
          <path d="M0,0 L1440,0 L1440,28 C1080,58 360,4 0,36 Z" fill="#F3EDE2" />
        </svg>
        <div className="container px-5 pt-4 sm:pt-6">
          <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-4 sm:gap-8">
            {[
              { num: t('land.stat1'), label: t('land.stat1Label') },
              { num: t('land.stat2'), label: t('land.stat2Label') },
              { num: t('land.stat3'), label: t('land.stat3Label') },
              { num: t('land.stat4'), label: t('land.stat4Label') },
            ].map(({ num, label }) => (
              <div key={num} className="text-center">
                <div className="text-3xl font-black sm:text-4xl" style={{ color: '#F4A261' }}>{num}</div>
                <div className="mt-1.5 text-xs leading-snug sm:text-sm" style={{ color: 'rgba(243,237,226,0.72)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 서비스 특징 카드 ─── */}
      <section className="overflow-hidden bg-muted pb-12 sm:pb-16">
        {/* Wave top: 네이비 스트립 → 뮤트 */}
        <svg viewBox="0 0 1440 52" preserveAspectRatio="none" aria-hidden="true" className="block w-full" style={{ height: '52px' }}>
          <path d="M0,0 L1440,0 L1440,36 C960,8 480,58 0,22 Z" fill="#1E2F52" />
        </svg>
        <div className="container px-5 pt-8 sm:pt-10">
          <div className="flex flex-col items-center gap-3 mb-12">
            <div className="flex items-center justify-center gap-2">
              <img src="/logo.svg" alt="BidVibe" className="h-9 w-auto" />
              <span className="text-2xl sm:text-3xl font-bold">{t('land.featOf')}</span>
            </div>
            <p className="text-center text-muted-foreground">{t('land.featSub')}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FlaskConical className="h-7 w-7 text-primary" />}
              title={t('land.feat1Title')}
              description={t('land.feat1Desc')}
              badge={t('land.feat1Badge')}
              badgeColor="primary"
            />
            <FeatureCard
              icon={<Lock className="h-7 w-7 text-primary" />}
              title={t('land.feat2Title')}
              description={t('land.feat2Desc')}
              badge="Sealed Bid"
              badgeColor="primary"
            />
            <FeatureCard
              icon={<Package className="h-7 w-7 text-primary" />}
              title={t('land.feat3Title')}
              description={t('land.feat3Desc')}
            />
            <FeatureCard
              icon={<ShieldCheck className="h-7 w-7 text-primary" />}
              title={t('land.feat4Title')}
              description={t('land.feat4Desc')}
            />
            <FeatureCard
              icon={<Megaphone className="h-7 w-7 text-amber-500" />}
              title={t('land.feat5Title')}
              description={t('land.feat5Desc')}
              badge={t('land.feat5Badge')}
              badgeColor="amber"
            />
            <FeatureCard
              icon={<BarChart3 className="h-7 w-7 text-primary" />}
              title={t('land.feat6Title')}
              description={t('land.feat6Desc')}
              badge="Pro"
              badgeColor="primary"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 bg-card">
        <div className="container px-5">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-8 sm:mb-12">{t('land.howTitle')}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              step="01"
              icon={<FlaskConical className="h-7 w-7 text-primary" />}
              title={t('land.step1Title')}
              description={t('land.step1Desc')}
            />
            <StepCard
              step="02"
              icon={<TrendingDown className="h-7 w-7 text-primary" />}
              title={t('land.step2Title')}
              description={t('land.step2Desc')}
            />
            <StepCard
              step="03"
              icon={<Clock className="h-7 w-7 text-primary" />}
              title={t('land.step3Title')}
              description={t('land.step3Desc')}
            />
          </div>
        </div>
      </section>

      {/* 접이식 사용흐름 */}
      <HowItWorks />

      {/* 혜택 비교 */}
      <section className="bg-muted py-12 sm:py-16">
        <div className="container px-5">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-8 sm:mb-12">{t('land.benefitTitle')}</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* 연구자 */}
            <div className="rounded-xl border-2 border-primary/40 bg-card p-6 shadow-sm">
              <div className="text-2xl mb-3">🔬</div>
              <h3 className="text-xl font-bold mb-1">{t('land.benefitRResearcher')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('land.benefitRSub')}</p>
              <ul className="space-y-2 text-sm">
                {[
                  t('land.benefitR1'),
                  t('land.benefitR2'),
                  t('land.benefitR3'),
                  t('land.benefitR4'),
                  t('land.benefitR5'),
                  t('land.benefitR6'),
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup/researcher" className={cn(buttonVariants({ size: 'sm' }), 'mt-6 w-full gap-1')}>
                {t('land.benefitRCta')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* 공급자 */}
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-6 shadow-sm">
              <div className="text-2xl mb-3">🏭</div>
              <h3 className="text-xl font-bold mb-1">{t('land.benefitSSupplier')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('land.benefitSSub')}</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2 rounded-md bg-amber-100 px-2 py-1.5 font-semibold text-amber-800">
                  <span className="mt-0.5">💸</span>
                  {t('land.benefitSFee')}
                </li>
                {[
                  t('land.benefitS1'),
                  t('land.benefitS2'),
                  t('land.benefitS3'),
                  t('land.benefitS4'),
                  t('land.benefitS5'),
                  t('land.benefitS6'),
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup/supplier" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-6 w-full border-amber-400 text-amber-800 hover:bg-amber-100')}>
                {t('land.benefitSCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 구독 플랜 — 준비 중 */}
      <section id="pricing" className="py-12 sm:py-16 bg-card">
        <div className="container text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('land.pricingTitle')}</h2>
          <p className="text-muted-foreground mb-10">{t('land.pricingSub')}</p>
          <div className="max-w-sm mx-auto rounded-xl border border-dashed border-border bg-muted/60 px-8 py-10 flex flex-col items-center gap-3">
            <Construction className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">{t('land.pricingPrep')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('land.pricingPrepDesc1')}<br />
              {t('land.pricingPrepDesc2')}
            </p>
          </div>
          <p className="mt-6 text-sm text-amber-600 font-medium">
            {t('land.pricingEarlybird')}
          </p>
          <div className="mx-auto mt-4 max-w-md rounded-lg border border-amber-300 bg-amber-50 px-5 py-3">
            <p className="text-sm font-bold text-amber-800">
              {t('land.pricingZeroFee')}
            </p>
          </div>
        </div>
      </section>

      {/* 대기자 이메일 수집 */}
      <section id="waitlist" className="border-t border-border bg-muted py-14 sm:py-20">
        <div className="container max-w-xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">{t('land.waitlistBadge')}</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('land.waitlistTitle')}</h2>
            <p className="text-muted-foreground">
              {t('land.waitlistSub')}
            </p>
          </div>
          <WaitlistForm />
        </div>
      </section>
    </>
  )
}

function FeatureCard({
  icon, title, description, badge, badgeColor,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  badgeColor?: 'primary' | 'amber'
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* 상단 컬러 바 */}
      <div className={cn('h-1.5', badgeColor === 'amber' ? 'bg-accent' : 'bg-primary')} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          {icon}
          {badge && (
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              badgeColor === 'amber'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-primary/10 text-primary'
            )}>
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-base mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function StepCard({ step, icon, title, description }: { step: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-6 shadow-sm relative">
      <span className="absolute top-4 right-4 text-3xl font-black text-muted-foreground/20 select-none leading-none">{step}</span>
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}
