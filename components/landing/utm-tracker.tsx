'use client'

import { useEffect } from 'react'

/**
 * UTM 파라미터를 sessionStorage에 저장해 가입 시 활용
 * 예: ?utm_source=threads, ?utm_source=discord, ?utm_source=everytime
 */
export function UtmTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const utm: Record<string, string> = {}
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        const v = params.get(key)
        if (v) utm[key] = v
      }
      // 랜딩 경로도 함께 저장 (UTM 없는 직접 진입도 추적)
      const landing_path = window.location.pathname
      const payload = { ...utm, landing_path, _t: Date.now() }
      // UTM이 있거나, 랜딩 페이지 진입인 경우만 저장
      if (Object.keys(utm).length > 0 || landing_path.startsWith('/landing')) {
        sessionStorage.setItem('bidvibe_utm', JSON.stringify(payload))
      }
    } catch {
      // sessionStorage 비활성·차단 시 조용히 무시
    }
  }, [])

  return null
}
