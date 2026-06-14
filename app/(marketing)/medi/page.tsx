'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { useT } from '@/lib/i18n/context'
import { ShieldCheck, Sparkles, Gift, ArrowRight } from 'lucide-react'

/**
 * BidVibe Medi — 미용·에스테틱 소모품 비공개 역경매 랜딩.
 * 전액 무료(의원·공급사) 메시지를 전면에 둔다.
 */
export default function MediLandingPage() {
  const t = useT()

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-lg font-extrabold tracking-tight">{t('medi.brand')}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          <Gift className="h-3 w-3" /> {t('medi.free.badge')}
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
        {t('medi.landing.h1')}
      </h1>
      <p className="mt-4 text-base text-muted-foreground leading-relaxed">
        {t('medi.tagline')}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {([
          ['medi.landing.benefit1Title', 'medi.landing.benefit1Desc'],
          ['medi.landing.benefit2Title', 'medi.landing.benefit2Desc'],
          ['medi.landing.benefit3Title', 'medi.landing.benefit3Desc'],
        ] as const).map(([titleKey, descKey]) => (
          <div key={titleKey} className="rounded-xl border border-border bg-background p-4">
            <ShieldCheck className="h-5 w-5 text-primary mb-2" />
            <div className="font-bold text-sm">{t(titleKey)}</div>
            <div className="mt-1 text-xs text-muted-foreground leading-snug">{t(descKey)}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/signup/clinic" className={buttonVariants({ size: 'lg' })}>
          {t('medi.landing.ctaClinic')} <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
        <Link href="/signup/medi-supplier" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          {t('medi.landing.ctaSupplier')}
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{t('medi.landing.freeNote')}</p>
    </main>
  )
}
