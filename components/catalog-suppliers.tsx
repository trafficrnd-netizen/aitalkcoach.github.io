'use client'

import Link from 'next/link'
import type { CatalogSupplier } from '@/lib/actions/supplier-catalog'
import { History, Trophy } from 'lucide-react'

interface Props {
  suppliers: CatalogSupplier[]
  substanceName: string
}

/** 이 시약을 공급한 이력이 있는 공급자 — 신뢰·CTR↑ */
export function CatalogSuppliers({ suppliers, substanceName }: Props) {
  if (!suppliers.length) return null

  function tierColor(t: string | null) {
    if (t === 'gold')   return '#D4AF37'
    if (t === 'silver') return '#A8A8A8'
    if (t === 'bronze') return '#CD7F32'
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
        <History className="h-3.5 w-3.5 text-primary" />
        이 시약 공급 이력이 있는 공급자
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        과거 거래완료 데이터를 기반으로 자동 누적된 정보입니다 ({substanceName}).
      </p>
      <ul className="space-y-2">
        {suppliers.map((s) => {
          const color = tierColor(s.tier)
          return (
            <li key={s.supplierId} className="flex items-center gap-3 rounded-md border border-border/60 bg-background px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm">{s.companyName}</span>
                  {color && (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold border"
                          style={{ borderColor: color, color, background: `${color}15` }}>
                      <Trophy className="h-2.5 w-2.5" />{s.tier}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  거래 <strong className="text-foreground">{s.transactionsCount}건</strong>
                  {s.avgUnitPrice != null && (
                    <> · 평균 단가 <strong className="text-foreground">{Math.round(s.avgUnitPrice).toLocaleString()}원{s.lastUnit ? `/${s.lastUnit}` : ''}</strong></>
                  )}
                  {s.lastDate && (
                    <> · 최근 {new Date(s.lastDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</>
                  )}
                </div>
              </div>
              {s.referralCode && (
                <Link href={`/p/${s.referralCode}`} className="text-xs text-secondary hover:underline shrink-0">
                  전용 채널 →
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
