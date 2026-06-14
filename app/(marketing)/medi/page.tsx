'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { useT } from '@/lib/i18n/context'
import { ShieldCheck, Sparkles, Gift, ArrowRight } from 'lucide-react'

/**
 * BidMedi — 미용·에스테틱 소모품 비공개 역경매 랜딩.
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

      {/* Magazine Editorial Photo Grid */}
      <section className="mt-16 -mx-5 overflow-hidden">

        {/* Section label */}
        <div className="px-5 mb-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-extrabold tracking-[0.35em] uppercase text-muted-foreground/50">
            에스테틱 케어
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Row 1: Hero pair 55/45 */}
        <div className="flex h-[340px] sm:h-[460px] gap-[2px]">
          <div className="relative overflow-hidden" style={{ width: '55%' }}>
            <img
              src="/medi-photos/photo-2.jpg"
              alt="시술 케어"
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 hover:scale-[1.04]"
            />
          </div>
          <div className="relative flex-1 overflow-hidden">
            <img
              src="/medi-photos/photo-1.jpg"
              alt="레이저 시술"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.04]"
            />
          </div>
        </div>

        {/* Row 2: Three equal strips */}
        <div className="flex h-[200px] sm:h-[270px] gap-[2px] mt-[2px]">
          {([
            { src: '/medi-photos/photo-3.jpg', pos: 'object-top' },
            { src: '/medi-photos/photo-4.jpg', pos: 'object-center' },
            { src: '/medi-photos/photo-5.jpg', pos: 'object-[center_20%]' },
          ] as const).map(({ src, pos }, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              <img
                src={src}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover ${pos} transition-transform duration-700 hover:scale-[1.04]`}
              />
            </div>
          ))}
        </div>

        {/* Row 3: Wide landscape footer with overlay */}
        <div className="relative mt-[2px] h-[130px] sm:h-[170px] overflow-hidden">
          <img
            src="/medi-photos/photo-6.jpg"
            alt="피부 케어"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 sm:px-8">
            <div>
              <p className="text-white/70 text-[9px] font-bold tracking-[0.35em] uppercase mb-1.5">
                BidMedi
              </p>
              <p className="text-white text-sm sm:text-[15px] font-bold leading-snug">
                프리미엄 에스테틱 소모품을 최저가로
              </p>
            </div>
          </div>
        </div>

      </section>
    </main>
  )
}
