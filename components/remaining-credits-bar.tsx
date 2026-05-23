'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coins, Gauge, ChevronRight } from 'lucide-react'

interface CreditData {
  role: 'researcher' | 'supplier'
  credits: number
  quota: {
    freeQuota: number
    used: number
    remaining: number
    isEarlyBird: boolean
    actionLabel: string
  }
}

/**
 * 페이지 하단에 표시되는 잔여 크레딧 · 무료 한도 바.
 * /api/me/credits 에서 데이터를 가져와 표시.
 */
export function RemainingCreditsBar() {
  const [data, setData] = useState<CreditData | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/me/credits')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (active && d && !d.error) setData(d)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (!data) return null

  const { credits, quota, role } = data
  const creditsHref = `/${role}/credits`
  const exhausted = quota.remaining === 0

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {/* 크레딧 잔액 */}
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15">
              <Coins className="h-4 w-4 text-accent-foreground" />
            </span>
            <div>
              <p className="text-[11px] leading-tight text-muted-foreground">보유 크레딧</p>
              <p className="text-sm font-bold leading-tight text-foreground">
                {credits.toLocaleString()} P
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* 무료 한도 */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                exhausted ? 'bg-destructive/15' : 'bg-primary/10'
              }`}
            >
              <Gauge
                className={`h-4 w-4 ${exhausted ? 'text-destructive' : 'text-primary'}`}
              />
            </span>
            <div>
              <p className="text-[11px] leading-tight text-muted-foreground">
                이번 주 무료 {quota.actionLabel}
              </p>
              <p className="text-sm font-bold leading-tight text-foreground">
                {quota.remaining}
                <span className="font-normal text-muted-foreground"> / {quota.freeQuota}회 남음</span>
              </p>
            </div>
          </div>
        </div>

        <Link
          href={creditsHref}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          크레딧 자세히 보기
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {exhausted && (
        <p className="mt-3 rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">
          이번 주 무료 한도를 모두 사용했습니다. 추가 {quota.actionLabel} 시 크레딧 1P가 사용됩니다.
        </p>
      )}
    </div>
  )
}
