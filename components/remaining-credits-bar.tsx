'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coins, Gauge, ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

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

export function RemainingCreditsBar() {
  const { t, lang } = useI18n()
  const [data, setData] = useState<CreditData | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/me/credits')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (active && d && !d.error) setData(d) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  if (!data) return null

  const { credits, quota, role } = data
  const creditsHref = `/${role}/credits`
  const exhausted = quota.remaining === 0
  const action = t(`cr.action.${role}`)

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
              <p className="text-[11px] leading-tight text-muted-foreground">{t('cr.balance')}</p>
              <p className="text-sm font-bold leading-tight text-foreground">
                {credits.toLocaleString(lang === 'en' ? 'en-US' : 'ko-KR')} P
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* 무료 한도 */}
          <div className="flex items-center gap-2">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${exhausted ? 'bg-destructive/15' : 'bg-primary/10'}`}>
              <Gauge className={`h-4 w-4 ${exhausted ? 'text-destructive' : 'text-primary'}`} />
            </span>
            <div>
              <p className="text-[11px] leading-tight text-muted-foreground">
                {t('cr.weeklyQuota').replace('{action}', action)}
              </p>
              <p className="text-sm font-bold leading-tight text-foreground">
                {quota.remaining}
                <span className="font-normal text-muted-foreground">
                  {' '}/ {quota.freeQuota} {t('cr.timesLeft').replace('{n}', '')}
                </span>
              </p>
            </div>
          </div>
        </div>

        <Link href={creditsHref} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {t('cr.viewDetails')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {exhausted && (
        <p className="mt-3 rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {t('cr.exhausted').replace('{action}', action)}
        </p>
      )}
    </div>
  )
}
