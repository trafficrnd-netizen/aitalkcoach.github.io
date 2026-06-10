'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export function EarlyBirdBanner() {
  const t = useT()
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/supplier-count')
      .then(r => r.json())
      .then(d => setLeft(d.earlyBirdLeft))
      .catch(() => setLeft(null))
  }, [])

  const seatText = left !== null && left > 0
    ? t('banner.seatsLeft').replace('{n}', String(left))
    : left === 0
    ? t('banner.seatsClosed')
    : t('banner.seatsBase')

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-xs sm:text-sm [word-break:keep-all]">
      {/* 모바일: 2줄 간결 / 데스크톱: 1줄 전체 */}
      <div className="flex flex-col items-center justify-center gap-x-3 gap-y-0.5 sm:flex-row sm:flex-wrap">
        <span>🔬 <strong>{t('banner.researcherFree')}</strong></span>
        <span className="hidden opacity-40 sm:inline">|</span>
        <span className="flex flex-wrap items-center justify-center gap-x-1.5">
          <span className="font-semibold">🎁 {t('banner.supplierEarly')}</span>
          <span className="opacity-90">{seatText}</span>
          <Link href="/signup/supplier" className="font-medium underline hover:opacity-80">
            {t('banner.registerNow')}
          </Link>
        </span>
        <span className="hidden opacity-40 sm:inline">|</span>
        <span className="font-semibold">💸 {t('banner.zeroFee')}</span>
      </div>
    </div>
  )
}
