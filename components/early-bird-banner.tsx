'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function EarlyBirdBanner() {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/supplier-count')
      .then(r => r.json())
      .then(d => setLeft(d.earlyBirdLeft))
      .catch(() => setLeft(null))
  }, [])

  return (
    <div className="bg-primary text-primary-foreground py-2.5 px-4 text-center text-sm">
      <span className="mr-4">🔬 <strong>연구자 완전 무료</strong></span>
      <span className="opacity-40 mr-4 hidden sm:inline">|</span>
      <span className="font-semibold">🎁 공급자 얼리버드</span>
      {left !== null && left > 0 ? (
        <span className="ml-2">
          처음 20개사 Pro 1개월 무료 —{' '}
          <span className="font-bold underline">{left}자리 남음</span>
        </span>
      ) : left === 0 ? (
        <span className="ml-2">얼리버드 마감</span>
      ) : (
        <span className="ml-2">처음 20개사 Pro 1개월 무료</span>
      )}
      <Link
        href="/signup/supplier"
        className="ml-3 underline font-medium hover:opacity-80"
      >
        지금 등록 →
      </Link>
    </div>
  )
}
