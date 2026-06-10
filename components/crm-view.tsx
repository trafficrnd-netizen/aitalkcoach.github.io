'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { issueCoupon, toggleCoupon, type CrmCustomer, type CrmCoupon } from '@/lib/actions/supplier-crm'
import { Users, Ticket, Building2 } from 'lucide-react'

export function CrmView({ customers, coupons: initialCoupons }: { customers: CrmCustomer[]; coupons: CrmCoupon[] }) {
  const router = useRouter()
  const [coupons, setCoupons] = useState(initialCoupons)
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', discountType: 'percent' as 'percent' | 'amount', discountValue: '',
    target: 'all_followers' as 'all_followers' | 'specific', targetResearcherId: '',
    validUntil: '', maxUses: '',
  })

  function submit() {
    setMsg(null)
    startTransition(async () => {
      const res = await issueCoupon({
        title: form.title,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        target: form.target,
        targetResearcherId: form.target === 'specific' ? form.targetResearcherId : null,
        validUntil: form.validUntil || null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
      })
      if (!res.ok) { setMsg('❌ ' + res.error); return }
      setMsg('✅ 쿠폰 발행 완료')
      setForm({ ...form, title: '', discountValue: '' })
      router.refresh()
    })
  }

  async function flip(id: string, active: boolean) {
    await toggleCoupon(id, active)
    setCoupons(coupons.map(c => c.id === id ? { ...c, active } : c))
  }

  return (
    <div className="space-y-8">
      {/* 유치 고객 목록 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">유치 고객 ({customers.length})</h2>
        </div>
        {customers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            아직 유치한 고객이 없습니다. 전용 코드(<code>/p/코드</code>)를 고객에게 공유해 팔로우를 받으세요.
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {customers.map((c) => (
              <div key={c.researcherId} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />{c.institution ?? '—'}
                    {c.viaCode && <span className="ml-1 font-mono">· {c.viaCode}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-primary">{c.dealCount}건 거래</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(c.followedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 팔로우
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 쿠폰 발행 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="h-5 w-5 text-accent-foreground" />
          <h2 className="font-semibold">할인 쿠폰 발행</h2>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>쿠폰 제목</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="예: 단골 고객 10% 할인" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>할인 방식</Label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value as 'percent' | 'amount' })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="percent">정률 (%)</option>
                <option value="amount">정액 (원)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>할인값</Label>
              <Input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === 'percent' ? '10' : '50000'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>대상</Label>
              <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value as 'all_followers' | 'specific' })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="all_followers">모든 팔로워</option>
                <option value="specific">특정 고객</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>유효기간 (선택)</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>
          {form.target === 'specific' && (
            <div className="space-y-1.5">
              <Label>대상 고객</Label>
              <select value={form.targetResearcherId} onChange={e => setForm({ ...form, targetResearcherId: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">선택하세요</option>
                {customers.map(c => <option key={c.researcherId} value={c.researcherId}>{c.name} ({c.institution ?? '—'})</option>)}
              </select>
            </div>
          )}
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? '발행 중...' : '쿠폰 발행'}
          </Button>
          {msg && <p className="text-sm text-center">{msg}</p>}
        </div>
      </section>

      {/* 발행한 쿠폰 목록 */}
      {coupons.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">발행한 쿠폰 ({coupons.length})</h2>
          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className={`rounded-lg border px-4 py-3 flex items-center justify-between ${c.active ? 'border-border' : 'border-border/40 opacity-60'}`}>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.discountType === 'percent' ? `${c.discountValue}% 할인` : `${c.discountValue.toLocaleString()}원 할인`}
                    {' · '}{c.target === 'all_followers' ? '모든 팔로워' : '특정 고객'}
                    {' · '}사용 {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}회
                    {c.validUntil && ` · ~${c.validUntil}`}
                  </div>
                </div>
                <button onClick={() => flip(c.id, !c.active)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${c.active ? 'bg-secondary/15 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                  {c.active ? '활성' : '비활성'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
