'use client'

import { useEffect, useState } from 'react'
import { getMyFollowedSuppliers, getMyAvailableCoupons, type AvailableCoupon } from '@/lib/actions/researcher-coupons'
import { Store, Ticket } from 'lucide-react'

export type RoutingMode = 'open' | 'direct' | 'both'

interface FollowedSupplier { supplierId: string; companyName: string; code: string | null }

interface Props {
  /** 부모가 선택 상태를 받도록 콜백 */
  onChange: (v: { mode: RoutingMode; supplierCode: string | null; couponId: string | null }) => void
}

/**
 * 견적 작성 시: 단골(팔로우) 공급자에게 직접 보낼지 / 공개 입찰 / 동시 선택 + 쿠폰 적용
 * 팔로우한 공급자가 없으면 아무것도 렌더하지 않음 (일반 흐름 유지).
 */
export function PreferredSupplierPicker({ onChange }: Props) {
  const [suppliers, setSuppliers] = useState<FollowedSupplier[]>([])
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([])
  const [loaded, setLoaded] = useState(false)

  const [mode, setMode] = useState<RoutingMode>('open')
  const [supplierCode, setSupplierCode] = useState<string | null>(null)
  const [couponId, setCouponId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getMyFollowedSuppliers(), getMyAvailableCoupons()]).then(([s, c]) => {
      setSuppliers(s)
      setCoupons(c)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  useEffect(() => {
    onChange({ mode, supplierCode, couponId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, supplierCode, couponId])

  if (!loaded || suppliers.length === 0) return null

  // 현재 선택한 공급자의 쿠폰만 필터
  const selectedSupplierId = suppliers.find(s => s.code === supplierCode)?.supplierId
  const applicableCoupons = coupons.filter(c => !selectedSupplierId || c.supplierId === selectedSupplierId)

  return (
    <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Store className="h-4 w-4 text-secondary" /> 단골 공급자 ({suppliers.length})
      </div>

      {/* 발송 방식 선택 */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { v: 'open', label: '공개 입찰', desc: '모든 공급사 경쟁' },
          { v: 'direct', label: '단골에게 직접', desc: '지정 공급사만' },
          { v: 'both', label: '동시', desc: '단골 + 공개' },
        ] as const).map(opt => (
          <button
            type="button"
            key={opt.v}
            onClick={() => { setMode(opt.v); if (opt.v === 'open') { setSupplierCode(null); setCouponId(null) } }}
            className={`rounded-md border p-2 text-left transition ${mode === opt.v ? 'border-secondary bg-secondary/10 ring-1 ring-secondary' : 'border-border hover:bg-muted/50'}`}
          >
            <div className="text-xs font-semibold">{opt.label}</div>
            <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* 단골 공급자 선택 */}
      {(mode === 'direct' || mode === 'both') && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium">대상 공급자</label>
          <select
            value={supplierCode ?? ''}
            onChange={e => { setSupplierCode(e.target.value || null); setCouponId(null) }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">선택하세요</option>
            {suppliers.filter(s => s.code).map(s => (
              <option key={s.supplierId} value={s.code!}>{s.companyName}</option>
            ))}
          </select>
        </div>
      )}

      {/* 쿠폰 선택 */}
      {(mode === 'direct' || mode === 'both') && supplierCode && applicableCoupons.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium flex items-center gap-1"><Ticket className="h-3 w-3" /> 보유 쿠폰</label>
          <select
            value={couponId ?? ''}
            onChange={e => setCouponId(e.target.value || null)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">쿠폰 미적용</option>
            {applicableCoupons.map(c => (
              <option key={c.couponId} value={c.couponId}>
                {c.title} — {c.discountType === 'percent' ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}원`} 할인
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground leading-snug">
        단골 공급자는 전용 코드로 팔로우한 곳입니다. &apos;동시&apos;는 단골 우대와 가격 경쟁을 함께 얻습니다.
      </p>
    </div>
  )
}
