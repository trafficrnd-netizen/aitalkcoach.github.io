/**
 * 랜딩 페이지 공통 셸 (Server Component)
 * Hero / Pain / Solution / Proof / CTA 블록을 props로 받아 렌더링
 *
 * UTM 파라미터는 클라이언트 컴포넌트에서 별도 추적
 */

import Link from 'next/link'
import { UtmTracker } from './utm-tracker'

export interface LandingShellProps {
  // SEO
  title: string
  description: string
  canonicalPath: string

  // Hero
  badge: string                  // 예: "🔬 연구자용"
  heroTitle: string              // 큰 헤드라인
  heroSub: string                // 부제목
  ctaPrimary: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }

  // Pain points (3개)
  pains: { icon: string; title: string; desc: string }[]

  // Solution steps (3개)
  steps: { num: string; title: string; desc: string }[]

  // Value proposition (4개)
  values: { icon: string; title: string; desc: string }[]

  // Proof points
  proofTitle: string
  proofItems: string[]

  // Final CTA
  finalCtaTitle: string
  finalCtaSub: string
}

export function LandingShell(props: LandingShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <UtmTracker />

      {/* Top bar */}
      <header className="sticky top-0 z-50 backdrop-blur bg-background/85 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-primary tracking-tight">
            BidVibe
          </Link>
          <nav className="flex gap-2 items-center text-sm">
            <Link href="/login" className="px-4 py-2 text-foreground/70 hover:text-foreground">
              로그인
            </Link>
            <Link href={props.ctaPrimary.href} className="px-4 py-2 rounded-md bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition">
              {props.ctaPrimary.label}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary/15 text-secondary text-sm font-semibold mb-5 sm:mb-6">
            {props.badge}
          </span>
          <h1 className="text-[2rem] sm:text-5xl md:text-6xl font-extrabold leading-tight text-primary mb-5 sm:mb-6 whitespace-pre-line [word-break:keep-all]">
            {props.heroTitle}
          </h1>
          <p className="text-base sm:text-xl text-foreground/70 leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto [word-break:keep-all]">
            {props.heroSub}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={props.ctaPrimary.href} className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-lg bg-accent text-accent-foreground font-bold text-base sm:text-lg shadow-sm hover:shadow-md hover:bg-accent/90 transition">
              {props.ctaPrimary.label}
            </Link>
            {props.ctaSecondary && (
              <Link href={props.ctaSecondary.href} className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-lg border-2 border-primary/20 text-primary font-bold text-base sm:text-lg hover:bg-primary/5 transition">
                {props.ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="px-5 py-12 sm:px-6 sm:py-20 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-primary mb-10 sm:mb-14">
            이런 어려움, 매주 겪으시죠?
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {props.pains.map((p, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-bold text-primary mb-3">{p.title}</h3>
                <p className="text-foreground/70 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution steps */}
      <section className="px-5 py-12 sm:px-6 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-primary mb-10 sm:mb-14">
            BidVibe는 이렇게 해결합니다
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {props.steps.map((s, i) => (
              <div key={i} className="bg-card rounded-xl p-8 border border-border/40">
                <div className="text-3xl font-extrabold text-accent mb-3">{s.num}</div>
                <h3 className="text-lg font-bold text-primary mb-2">{s.title}</h3>
                <p className="text-foreground/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-5 py-12 sm:px-6 sm:py-20 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-primary mb-10 sm:mb-14">
            왜 BidVibe인가
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {props.values.map((v, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-background border border-border/40">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-base font-bold text-primary mb-2">{v.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="px-5 py-12 sm:px-6 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-primary mb-8 sm:mb-10 [word-break:keep-all]">
            {props.proofTitle}
          </h2>
          <ul className="space-y-4">
            {props.proofItems.map((item, i) => (
              <li key={i} className="flex gap-4 items-start p-5 rounded-lg bg-secondary/10 border border-secondary/20">
                <span className="text-secondary text-xl shrink-0">✓</span>
                <span className="text-foreground/85 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-16 sm:px-6 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 sm:mb-5 whitespace-pre-line [word-break:keep-all]">
            {props.finalCtaTitle}
          </h2>
          <p className="text-base sm:text-lg opacity-80 mb-8 sm:mb-10 leading-relaxed [word-break:keep-all]">
            {props.finalCtaSub}
          </p>
          <Link href={props.ctaPrimary.href} className="inline-block w-full sm:w-auto px-10 py-4 sm:py-5 rounded-lg bg-accent text-accent-foreground font-extrabold text-lg sm:text-xl shadow-lg hover:shadow-xl hover:bg-accent/90 transition">
            {props.ctaPrimary.label}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border/40 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-4 text-sm text-foreground/60">
          <div>© 2025 BidVibe — ai-traffic.kr</div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">홈</Link>
            <Link href="/login" className="hover:text-foreground">로그인</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
