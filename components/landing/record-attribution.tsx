'use client'

import { useEffect } from 'react'

/**
 * 가입 직후 자동으로 attribution을 서버에 기록합니다.
 * 가입 후 첫 페이지(/researcher/board 등)에 마운트되면 sessionStorage의 UTM을 읽어
 * /api/attribution 으로 1회 전송 후 sessionStorage를 비웁니다.
 */
export function RecordAttribution({ role }: { role: 'researcher' | 'supplier' }) {
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('bidvibe_utm')
      if (!raw) return
      const utm = JSON.parse(raw)
      fetch('/api/attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, ...utm, referrer: document.referrer }),
      }).then(() => {
        sessionStorage.removeItem('bidvibe_utm')
      }).catch(() => null)
    } catch {
      // 무시
    }
  }, [role])

  return null
}
