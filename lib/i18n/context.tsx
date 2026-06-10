'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { translate, type Lang } from './dictionary'

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const COOKIE_KEY = 'bidvibe_lang'

function readCookieLang(): Lang | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)bidvibe_lang=(ko|en)/)
  return (m?.[1] as Lang) ?? null
}

export function LanguageProvider({
  initialLang = 'ko',
  children,
}: {
  initialLang?: Lang
  children: React.ReactNode
}) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  // 클라이언트 마운트 시 쿠키/스토리지 우선 적용
  useEffect(() => {
    const fromCookie = readCookieLang()
    if (fromCookie && fromCookie !== lang) {
      setLangState(fromCookie)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      // 1년 유지
      document.cookie = `${COOKIE_KEY}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      localStorage.setItem(COOKIE_KEY, next)
      document.documentElement.lang = next
    } catch {
      // 무시
    }
  }, [])

  const t = useCallback((key: string) => translate(lang, key), [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Provider 밖에서 호출 시 안전 폴백 (한국어)
    return {
      lang: 'ko',
      setLang: () => {},
      t: (key: string) => translate('ko', key),
    }
  }
  return ctx
}

/** 편의 훅 — 번역 함수만 */
export function useT() {
  return useI18n().t
}
