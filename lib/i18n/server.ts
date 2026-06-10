/**
 * 서버 컴포넌트용 번역 유틸 — 쿠키에서 언어를 읽어 t() 제공
 */
import { cookies } from 'next/headers'
import { translate, type Lang } from './dictionary'

export function getServerLang(): Lang {
  try {
    const v = cookies().get('bidvibe_lang')?.value
    return v === 'en' ? 'en' : 'ko'
  } catch {
    return 'ko'
  }
}

export function getServerT() {
  const lang = getServerLang()
  return (key: string) => translate(lang, key)
}
