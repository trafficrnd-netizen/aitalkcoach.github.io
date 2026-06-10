'use client'

import { Users, TrendingDown } from 'lucide-react'

interface Props {
  researcherCount: number
  requestCount: number
  totalQty: number
  unit: string | null
}

/**
 * 그룹 바이 안내 — 같은 시약을 다른 연구자도 요청 중일 때 표시
 * 동기: 공급자에게 합산 수량이 보이면 단가 인하 견적을 받기 쉬워짐
 */
export function GroupBuyBanner({ researcherCount, requestCount, totalQty, unit }: Props) {
  if (researcherCount < 1) return null
  return (
    <div className="rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary">
        <Users className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <TrendingDown className="h-3.5 w-3.5 text-secondary" />
          그룹 바이 진행 중 — 다른 연구자 <span className="text-secondary">{researcherCount}명</span>이 같은 시약 요청
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          합산 수량 <strong className="text-foreground">{totalQty.toLocaleString()}{unit ? ` ${unit}` : ''}</strong> ·
          요청 {requestCount}건 (최근 7일). 공급자가 묶음 견적을 검토할 수 있어 단가 인하 가능성이 높습니다.
        </p>
      </div>
    </div>
  )
}
