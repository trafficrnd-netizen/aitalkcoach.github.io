'use client'

import { Globe } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import type { Lang } from '@/lib/i18n/dictionary'

/**
 * 한/영 언어 전환 토글.
 * variant:
 *  - 'pill'    : 둥근 칩 (기본, 헤더 데스크탑용)
 *  - 'compact' : 아이콘 + 현재 언어 코드만 (모바일 헤더용)
 *  - 'inline'  : 텍스트형 (사이드바·푸터용)
 */
export function LanguageToggle({ variant = 'pill' }: { variant?: 'pill' | 'compact' | 'inline' }) {
  const { lang, setLang } = useI18n()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const next: Lang = lang === 'ko' ? 'en' : 'ko'

  function toggle() {
    setLang(next)
    startTransition(() => { router.refresh() })
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition"
        aria-label="Switch language"
      >
        <Globe className="h-3.5 w-3.5" />
        {lang === 'ko' ? 'KO' : 'EN'}
      </button>
    )
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span className={lang === 'ko' ? 'font-bold text-foreground' : ''}>KO</span>
        <span className="text-border">/</span>
        <span className={lang === 'en' ? 'font-bold text-foreground' : ''}>EN</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition"
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4" />
      {lang === 'ko' ? '한국어' : 'English'}
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{lang === 'ko' ? 'EN' : 'KO'}</span>
    </button>
  )
}
