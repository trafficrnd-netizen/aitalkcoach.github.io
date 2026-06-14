'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { useT } from '@/lib/i18n/context'
import { ShieldCheck, Sparkles, Gift, ArrowRight } from 'lucide-react'

export default function MediLandingPage() {
  const t = useT()
  return (
    <main className="mx-auto max-w-3xl px-5 pt-5 pb-0 sm:py-16">

      {/* ── 배지 + 브랜드 ── */}
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <span className="text-base sm:text-lg font-extrabold tracking-tight">{t('medi.brand')}</span>
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          <Gift className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {t('medi.free.badge')}
        </span>
      </div>

      {/* ── 히어로 ── */}
      <h1 className="text-[1.65rem] sm:text-4xl font-black leading-tight tracking-tight">
        찾지 말고, 비공개 최저가로<br />받으세요
      </h1>
      <p className="hidden sm:block mt-3 text-base text-muted-foreground leading-relaxed">
        {t('medi.tagline')}
      </p>

      {/* ── 혜택 카드 — 모바일 숨김 ── */}
      <div className="hidden sm:grid mt-6 gap-3 sm:grid-cols-3">
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

      {/* ── CTA ── */}
      <div className="mt-4 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
        <Link href="/signup/clinic" className={buttonVariants({ size: 'default' })}>
          {t('medi.landing.ctaClinic')} <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
        <Link href="/signup/medi-supplier" className={buttonVariants({ variant: 'outline', size: 'default' })}>
          {t('medi.landing.ctaSupplier')}
        </Link>
      </div>

      <p className="mt-2 sm:mt-6 text-[10px] sm:text-xs text-muted-foreground">
        {t('medi.landing.freeNote')}
      </p>

      {/* ── Magazine Editorial Photo Grid ── */}
      <section className="mt-3 sm:mt-14 -mx-5 overflow-hidden">

        {/* Section label — sm+ only */}
        <div className="hidden sm:flex px-5 mb-5 items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-extrabold tracking-[0.35em] uppercase text-muted-foreground/50">
            에스테틱 케어
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Row 1: Hero pair 55/45 */}
        <div className="flex h-[155px] sm:h-[460px] gap-[2px]">
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
        <div className="flex h-[105px] sm:h-[270px] gap-[2px] mt-[2px]">
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
        <div className="relative mt-[2px] h-[75px] sm:h-[170px] overflow-hidden">
          <img
            src="/medi-photos/photo-6.jpg"
            alt="피부 케어"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 sm:px-8">
            <div>
              <p className="text-white/70 text-[9px] font-bold tracking-[0.35em] uppercase mb-1">
                BidMedi
              </p>
              <p className="text-white text-xs sm:text-[15px] font-bold leading-snug">
                프리미엄 에스테틱 소모품을 최저가로
              </p>
            </div>
          </div>
        </div>

      </section>
    </main>
  )
}
