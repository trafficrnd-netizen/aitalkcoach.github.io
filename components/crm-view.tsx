'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  issueCoupon, toggleCoupon, respondToCouponRequest,
  type CrmCustomer, type CrmCoupon, type IncomingCouponRequest,
} from '@/lib/actions/supplier-crm'
import { Users, Ticket, Building2, Bell, Star } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export function CrmView({
  customers,
  coupons: initialCoupons,
  couponRequests: initialRequests = [],
}: {
  customers: CrmCustomer[]
  coupons: CrmCoupon[]
  couponRequests?: IncomingCouponRequest[]
}) {
  const t = useT()
  const router = useRouter()
  const [coupons, setCoupons] = useState(initialCoupons)
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [reqStatuses, setReqStatuses] = useState<Record<string, 'pending' | 'fulfilled' | 'declined'>>(
    Object.fromEntries(initialRequests.map(r => [r.id, r.status]))
  )
  const [reqPending, setReqPending] = useState<string | null>(null)

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
      setMsg(t('crm.doneIssue'))
      setForm({ ...form, title: '', discountValue: '' })
      router.refresh()
    })
  }

  async function flip(id: string, active: boolean) {
    await toggleCoupon(id, active)
    setCoupons(coupons.map(c => c.id === id ? { ...c, active } : c))
  }

  async function handleRespond(id: string, status: 'fulfilled' | 'declined') {
    setReqPending(id)
    await respondToCouponRequest(id, status)
    setReqStatuses(prev => ({ ...prev, [id]: status }))
    setReqPending(null)
  }

  const pendingRequestCount = initialRequests.filter(r => (reqStatuses[r.id] ?? r.status) === 'pending').length

  return (
    <div className="space-y-8">
      {/* 쿠폰 요청 수신함 — 단골 연구자에게 받은 요청 */}
      {initialRequests.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">
              {t('crm.requestsTitle')}
              {pendingRequestCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px]">
                  {pendingRequestCount}
                </span>
              )}
            </h2>
          </div>
          <div className="rounded-lg border border-border divide-y divide-border">
            {initialRequests.map(req => {
              const currentStatus = reqStatuses[req.id] ?? req.status
              return (
                <div key={req.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-secondary fill-secondary shrink-0" />
                      {req.researcherName}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {req.institution ?? '—'} · {new Date(req.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </div>
                    {req.message && (
                      <div className="text-xs text-foreground mt-0.5 italic">&ldquo;{req.message}&rdquo;</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {currentStatus === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={reqPending === req.id}
                          onClick={() => handleRespond(req.id, 'fulfilled')}
                        >
                          {reqPending === req.id ? '…' : t('crm.issueBtn')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground"
                          disabled={reqPending === req.id}
                          onClick={() => handleRespond(req.id, 'declined')}
                        >
                          {t('crm.declineBtn')}
                        </Button>
                      </>
                    ) : currentStatus === 'fulfilled' ? (
                      <span className="text-xs text-secondary font-medium">{t('crm.issuedMark')}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('crm.declinedMark')}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 유치 고객 목록 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">{t('crm.customersTitle')} ({customers.length})</h2>
        </div>
        {customers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            {t('crm.noCustomers')}
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
                  <div className="text-sm font-bold text-primary">{t('crm.deals').replace('{n}', String(c.dealCount))}</div>
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
          <h2 className="font-semibold">{t('crm.couponFormTitle')}</h2>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>{t('crm.couponTitleLabel')}</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={t('crm.couponTitlePh')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('crm.discountType')}</Label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value as 'percent' | 'amount' })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="percent">{t('crm.discountPct')}</option>
                <option value="amount">{t('crm.discountAmt')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('crm.discountValue')}</Label>
              <Input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === 'percent' ? '10' : '50000'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('crm.target')}</Label>
              <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value as 'all_followers' | 'specific' })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="all_followers">{t('crm.targetAll')}</option>
                <option value="specific">{t('crm.targetSpecific')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('crm.validUntil')}</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>
          {form.target === 'specific' && (
            <div className="space-y-1.5">
              <Label>{t('crm.targetCustomer')}</Label>
              <select value={form.targetResearcherId} onChange={e => setForm({ ...form, targetResearcherId: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{t('crm.targetSelect')}</option>
                {customers.map(c => <option key={c.researcherId} value={c.researcherId}>{c.name} ({c.institution ?? '—'})</option>)}
              </select>
            </div>
          )}
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? t('crm.issuing') : t('crm.issueCouponBtn')}
          </Button>
          {msg && <p className="text-sm text-center">{msg}</p>}
        </div>
      </section>

      {/* 발행한 쿠폰 목록 */}
      {coupons.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">{t('crm.issuedCouponsTitle')} ({coupons.length})</h2>
          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className={`rounded-lg border px-4 py-3 flex items-center justify-between ${c.active ? 'border-border' : 'border-border/40 opacity-60'}`}>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.discountType === 'percent' ? `${c.discountValue}${t('crm.discountPctSuffix')}` : `${c.discountValue.toLocaleString()}${t('crm.discountAmtSuffix')}`}
                    {' · '}{c.target === 'all_followers' ? t('crm.targetAll') : t('crm.targetSpecific')}
                    {' · '}{t('crm.usedTimes').replace('{n}', `${c.usedCount}${c.maxUses ? '/' + c.maxUses : ''}`)}
                    {c.validUntil && ` · ~${c.validUntil}`}
                  </div>
                </div>
                <button onClick={() => flip(c.id, !c.active)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${c.active ? 'bg-secondary/15 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                  {c.active ? t('crm.active') : t('crm.inactive')}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
