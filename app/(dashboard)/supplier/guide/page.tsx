import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  Store,
  UserCheck,
  FileEdit,
  Bell,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Star,
  CircleDollarSign,
  PackageCheck,
} from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export default function SupplierGuidePage() {
  const t = getServerT()
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t('guide.s.title')}</h1>
        <p className="text-muted-foreground">{t('guide.s.sub')}</p>
      </div>

      {/* 핵심 개념 */}
      <section className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-2">
        <h2 className="font-semibold text-primary">{t('guide.s.conceptTitle')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('guide.s.conceptDesc')}
        </p>
        <div className="flex items-center gap-2 pt-1 text-sm font-medium text-primary">
          <TrendingUp className="h-4 w-4" />
          {t('guide.s.conceptTag')}
        </div>
      </section>

      {/* 시작하기 4단계 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">{t('guide.s.stepsTitle')}</h2>
        <div className="space-y-3">
          <StepCard
            step={1}
            icon={<UserCheck className="h-5 w-5 text-primary" />}
            title={t('guide.s.step1Title')}
            desc={t('guide.s.step1Desc')}
            tip={t('guide.s.step1Tip')}
          />
          <StepCard
            step={2}
            icon={<FileEdit className="h-5 w-5 text-primary" />}
            title={t('guide.s.step2Title')}
            desc={t('guide.s.step2Desc')}
            tip={t('guide.s.step2Tip')}
          />
          <StepCard
            step={3}
            icon={<Store className="h-5 w-5 text-primary" />}
            title={t('guide.s.step3Title')}
            desc={t('guide.s.step3Desc')}
            tip={t('guide.s.step3Tip')}
          />
          <StepCard
            step={4}
            icon={<Bell className="h-5 w-5 text-primary" />}
            title={t('guide.s.step4Title')}
            desc={t('guide.s.step4Desc')}
            tip={t('guide.s.step4Tip')}
          />
        </div>
        <Link href="/supplier/settings" className={buttonVariants({ size: 'sm' })}>
          {t('guide.s.stepsCta')} <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </section>

      {/* 입찰 전략 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t('guide.s.tipsTitle')}</h2>
        <div className="space-y-2">
          <TipCard icon={<ShieldCheck className="h-4 w-4 text-primary" />} title={t('guide.s.tip1Title')} desc={t('guide.s.tip1Desc')} />
          <TipCard icon={<PackageCheck className="h-4 w-4 text-primary" />} title={t('guide.s.tip2Title')} desc={t('guide.s.tip2Desc')} />
          <TipCard icon={<Star className="h-4 w-4 text-primary" />} title={t('guide.s.tip3Title')} desc={t('guide.s.tip3Desc')} />
          <TipCard icon={<CircleDollarSign className="h-4 w-4 text-primary" />} title={t('guide.s.tip4Title')} desc={t('guide.s.tip4Desc')} />
        </div>
      </section>

      {/* 구독 플랜 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t('guide.s.plansTitle')}</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t('guide.s.planColPlan')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('guide.s.planColPrice')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('guide.s.planColBid')}</th>
                <th className="px-4 py-2 text-left font-medium">{t('guide.s.planColApi')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { plan: 'Free', price: t('guide.s.planFreePrice'), bid: t('guide.s.planFreeBid'), api: '—' },
                { plan: 'Basic', price: t('guide.s.planBasicPrice'), bid: t('guide.s.planBasicBid'), api: '—' },
                { plan: 'Pro', price: t('guide.s.planProPrice'), bid: t('guide.s.planProBid'), api: '✅' },
                { plan: 'Enterprise', price: t('guide.s.planEntPrice'), bid: t('guide.s.planEntBid'), api: '✅' },
              ].map(row => (
                <tr key={row.plan}>
                  <td className="px-4 py-2 font-medium">{row.plan}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.price}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.bid}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.api}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{t('guide.s.plansNote')}</p>
        <Link href="/supplier/billing" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <CreditCard className="mr-2 h-4 w-4" /> {t('guide.s.plansCta')}
        </Link>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t('guide.s.faqTitle')}</h2>
        <div className="space-y-2">
          <FaqItem q={t('guide.s.faq1q')} a={t('guide.s.faq1a')} />
          <FaqItem q={t('guide.s.faq2q')} a={t('guide.s.faq2a')} />
          <FaqItem q={t('guide.s.faq3q')} a={t('guide.s.faq3a')} />
          <FaqItem q={t('guide.s.faq4q')} a={t('guide.s.faq4a')} />
        </div>
      </section>
    </div>
  )
}

function StepCard({ step, icon, title, desc, tip }: {
  step: number; icon: React.ReactNode; title: string; desc: string; tip: string
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {step}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-semibold">{icon} {title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        <p className="text-xs text-primary/80 bg-primary/5 rounded px-2 py-1 inline-block">{tip}</p>
      </div>
    </div>
  )
}

function TipCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border p-4">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="font-medium text-sm mb-1">Q. {q}</div>
      <p className="text-sm text-muted-foreground">A. {a}</p>
    </div>
  )
}
