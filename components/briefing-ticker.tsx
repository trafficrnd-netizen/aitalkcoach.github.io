'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'

type BriefingItem = {
  id: string
  title: string
  type: string
  status: string
  deadline: string | null
  bidCount: number
}

export function BriefingTicker() {
  const { lang, t } = useI18n()
  const FEATURES = [t('ticker.f1'), t('ticker.f2'), t('ticker.f3'), t('ticker.f4'), t('ticker.f5'), t('ticker.f6')]

  const [items, setItems] = useState<BriefingItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    fetch('/api/briefing')
      .then(r => r.json())
      .then(d => {
        if (d.items?.length >= 3) setItems(d.items)
      })
      .catch(() => {})
  }, [])

  function formatItem(item: BriefingItem): string {
    const type = item.type === 'batch' ? t('ticker.typeBatch') : t('ticker.typeSingle')
    const status = item.status === 'open' ? t('ticker.statusOpen') : t('ticker.statusClosed')
    const bids = item.bidCount > 0 ? ` · ${t('ticker.bids').replace('{n}', String(item.bidCount))}` : ''
    const deadline = item.deadline
      ? ` · ${t('ticker.deadline')} ${new Date(item.deadline).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric' })}`
      : ''
    return `[${type}] ${item.title} — ${status}${bids}${deadline}`
  }

  const texts = items ? items.map(formatItem) : FEATURES

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % texts.length)
        setFade(true)
      }, 300)
    }, 4500)
    return () => clearInterval(timer)
  }, [texts.length])

  return (
    <div className="bg-muted/60 border-b border-border py-2 px-4 text-center text-sm text-muted-foreground overflow-hidden">
      <span
        style={{ transition: 'opacity 0.3s', opacity: fade ? 1 : 0 }}
        className="inline-block"
      >
        {texts[index % texts.length]}
      </span>
    </div>
  )
}
