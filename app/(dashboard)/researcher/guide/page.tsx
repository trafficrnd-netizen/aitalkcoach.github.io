import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  FlaskConical,
  Search,
  SendHorizonal,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  ShieldCheck,
  TrendingDown,
  MessageSquare,
} from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export default function ResearcherGuidePage() {
  const t = getServerT()
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t('guide.r.title')}</h1>
        <p className="text-muted-foreground">{t('guide.r.sub')}</p>
      </div>

      {/* 핵심 개념 */}
      <section className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-2">
        <h2 className="font-semibold text-primary">{t('guide.r.conceptTitle')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('guide.r.conceptDesc')}
        </p>
        <div className="flex items-center gap-2 pt-1 text-sm font-medium text-primary">
          <TrendingDown className="h-4 w-4" />
          {t('guide.r.conceptTag')}
        </div>
      </section>

      {/* 시작하기 4단계 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">{t('guide.r.stepsTitle')}</h2>
        <div className="space-y-3">
          <StepCard
            step={1}
            icon={<Search className="h-5 w-5 text-primary" />}
            title={t('guide.r.step1Title')}
            desc={t('guide.r.step1Desc')}
            tip={t('guide.r.step1Tip')}
          />
          <StepCard
            step={2}
            icon={<FlaskConical className="h-5 w-5 text-primary" />}
            title={t('guide.r.step2Title')}
            desc={t('guide.r.step2Desc')}
            tip={t('guide.r.step2Tip')}
          />
          <StepCard
            step={3}
            icon={<SendHorizonal className="h-5 w-5 text-primary" />}
            title={t('guide.r.step3Title')}
            desc={t('guide.r.step3Desc')}
            tip={t('guide.r.step3Tip')}
          />
          <StepCard
            step={4}
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            title={t('guide.r.step4Title')}
            desc={t('guide.r.step4Desc')}
            tip={t('guide.r.step4Tip')}
          />
        </div>
        <Link href="/researcher/request" className={buttonVariants({ size: 'sm' })}>
          {t('guide.r.stepsCta')} <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </section>

      {/* 묶음 견적 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t('guide.r.bulkTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('guide.r.bulkDesc')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <MethodCard
            icon={<FlaskConical className="h-4 w-4 text-primary" />}
            title={t('guide.r.bulk1Title')}
            desc={t('guide.r.bulk1Desc')}
          />
          <MethodCard
            icon={<FileSpreadsheet className="h-4 w-4 text-primary" />}
            title={t('guide.r.bulk2Title')}
            desc={t('guide.r.bulk2Desc')}
          />
        </div>
      </section>

      {/* 핵심 규칙 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t('guide.r.rulesTitle')}</h2>
        <div className="space-y-2">
          <RuleCard
            icon={<ShieldCheck className="h-4 w-4 text-primary" />}
            title={t('guide.r.rule1Title')}
            desc={t('guide.r.rule1Desc')}
          />
          <RuleCard
            icon={<MessageSquare className="h-4 w-4 text-primary" />}
            title={t('guide.r.rule2Title')}
            desc={t('guide.r.rule2Desc')}
          />
          <RuleCard
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            title={t('guide.r.rule3Title')}
            desc={t('guide.r.rule3Desc')}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t('guide.r.faqTitle')}</h2>
        <div className="space-y-2">
          <FaqItem q={t('guide.r.faq1q')} a={t('guide.r.faq1a')} />
          <FaqItem q={t('guide.r.faq2q')} a={t('guide.r.faq2a')} />
          <FaqItem q={t('guide.r.faq3q')} a={t('guide.r.faq3a')} />
          <FaqItem q={t('guide.r.faq4q')} a={t('guide.r.faq4a')} />
        </div>
      </section>
    </div>
  )
}

function StepCard({
  step, icon, title, desc, tip,
}: {
  step: number
  icon: React.ReactNode
  title: string
  desc: string
  tip: string
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {step}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          {icon} {title}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        <p className="text-xs text-primary/80 bg-primary/5 rounded px-2 py-1 inline-block">{tip}</p>
      </div>
    </div>
  )
}

function MethodCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-1">
      <div className="flex items-center gap-2 font-medium text-sm">{icon} {title}</div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  )
}

function RuleCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
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
