'use client'

import { useEffect, useState } from 'react'

type BriefingItem = {
  id: string
  title: string
  type: string
  status: string
  deadline: string | null
  bidCount: number
}

const FEATURES = [
  '🔬 연구자 완전 무료 — 견적 요청·비교·낙찰 모두 무료',
  '🔒 가격 비공개 입찰 — 낙찰 전까지 경쟁사 금액 비공개',
  '📦 묶음 견적 요청 — 여러 품목을 한 번에 비교',
  '⭐ 양방향 신뢰 평가 — 거래 후 상호 별점 공개',
  '📣 공급자 광고 게시판 — 로그인 첫 화면 노출',
  '🎁 얼리버드 — 처음 20개사 Pro 1개월 무료',
]

function formatItem(item: BriefingItem): string {
  const type = item.type === 'batch' ? '묶음' : '단일'
  const status = item.status === 'open' ? '입찰 진행중' : '낙찰 완료'
  const bids = item.bidCount > 0 ? ` · 견적 ${item.bidCount}건` : ''
  const deadline = item.deadline
    ? ` · 마감 ${new Date(item.deadline).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
    : ''
  return `[${type}] ${item.title} — ${status}${bids}${deadline}`
}

export function BriefingTicker() {
  const [texts, setTexts] = useState<string[]>(FEATURES)
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    fetch('/api/briefing')
      .then(r => r.json())
      .then(d => {
        if (d.items?.length >= 3) {
          setTexts(d.items.map(formatItem))
        }
      })
      .catch(() => {})
  }, [])

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
        {texts[index]}
      </span>
    </div>
  )
}
