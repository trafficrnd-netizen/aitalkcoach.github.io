'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { claimLabGroup, type LabGroupStatus } from '@/lib/actions/lab-group'
import { requestCoupon } from '@/lib/actions/researcher-coupons'
import { FlaskConical, Users, Copy, Check, ShoppingCart, Ticket, Star } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export type FollowedSupplierItem = { supplierId: string; companyName: string }

interface Props {
  status: LabGroupStatus
  groupBuyCount?: number
  preferredSuppliers?: FollowedSupplierItem[]
  couponRequestStatuses?: Record<string, 'pending' | 'fulfilled' | 'declined'>
}

export function LabGroupWidget({
  status: initial,
  groupBuyCount = 0,
  preferredSuppliers = [],
  couponRequestStatuses = {},
}: Props) {
  const t = useT()
  const [status, setStatus] = useState(initial)
  const [name, setName] = useState('')
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [requestedMap, setRequestedMap] = useState<Record<string, 'pending' | 'fulfilled' | 'declined'>>(couponRequestStatuses)
  const [couponPending, setCouponPending] = useState<string | null>(null)

  const pct = Math.min(100, Math.round((status.peerCount / status.threshold) * 100))
  const eligible = status.peerCount >= status.threshold
  const hasPreferred = preferredSuppliers.length > 0

  async function claim() {
    setErr(null)
    startTransition(async () => {
      const r = await claimLabGroup(name)
      if (!r.ok) {
        setErr(r.reason === 'threshold_not_met'
          ? t('lg.errThreshold').replace('{n}', String(r.count ?? 0)).replace('{threshold}', String(status.threshold))
          : r.reason === 'no_institution' ? t('lg.errNoInstitution') : t('lg.errGeneric').replace('{reason}', r.reason ?? ''))
        return
      }
      setStatus({ ...status, joined: true, isLeader: true, group: { id: r.labId, name: name || (status.institution ?? t('lg.title')), code: r.code, memberCount: r.count } })
    })
  }

  async function copy() {
    if (!status.group?.code) return
    try {
      await navigator.clipboard.writeText(`https://ai-traffic.kr/lab/${status.group.code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* 무시 */ }
  }

  async function handleRequestCoupon(supplierId: string) {
    setCouponPending(supplierId)
    const r = await requestCoupon(supplierId)
    if (r.ok) setRequestedMap(prev => ({ ...prev, [supplierId]: 'pending' }))
    setCouponPending(null)
  }

  return (
    <div className="rounded-xl border-2 border-secondary/40 bg-gradient-to-br from-secondary/5 to-primary/5 p-5">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="h-4 w-4 text-secondary" />
        <h3 className="font-bold text-foreground">{t('lg.title')}</h3>
        {status.group && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">
            {status.isLeader ? t('lg.leader') : t('lg.member')}
          </span>
        )}
      </div>

      {status.institution ? (
        <p className="text-xs text-muted-foreground mb-3">
          소속: <strong className="text-foreground">{status.institution}</strong>
          {status.department ? <> · {status.department}</> : null}
        </p>
      ) : (
        <p className="text-xs text-amber-600 mb-3">{t('lg.noAffil')}</p>
      )}

      {status.group ? (
        <div className="space-y-3">
          {/* 그룹 코드 / 인원 */}
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">{status.group.name}</span>
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {t('lg.memberCount').replace('{n}', String(status.group.memberCount))}
              </span>
            </div>
            {status.group.code && (
              <div className="font-mono text-2xl font-extrabold tracking-widest text-primary text-center py-1">
                {status.group.code}
              </div>
            )}
          </div>
          {status.group.code && (
            <Button size="sm" variant="outline" onClick={copy} className="w-full">
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? t('lg.copied') : t('lg.copyLink')}
            </Button>
          )}

          {/* 그룹 바이 요약 */}
          {groupBuyCount > 0 && (
            <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 flex items-start gap-2.5">
              <ShoppingCart className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{t('lg.groupBuyActive').replace('{n}', String(groupBuyCount))}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {t('lg.groupBuyDesc')}
                </p>
              </div>
              <Link href="/researcher/marketplace">
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">{t('lg.viewBtn')}</Button>
              </Link>
            </div>
          )}

          {/* 단골 공급사 쿠폰 요청 / 초대 CTA */}
          {hasPreferred ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground">{t('lg.couponReqTitle')}</span>
              </div>
              <div className="space-y-2">
                {preferredSuppliers.map(s => {
                  const reqStatus = requestedMap[s.supplierId]
                  return (
                    <div key={s.supplierId} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground truncate flex items-center gap-1">
                        <Star className="h-3 w-3 text-secondary fill-secondary shrink-0" />
                        {s.companyName}
                      </span>
                      {reqStatus === 'fulfilled' ? (
                        <span className="text-[11px] text-secondary font-medium shrink-0">{t('lg.couponIssued')}</span>
                      ) : reqStatus === 'pending' ? (
                        <span className="text-[11px] text-muted-foreground shrink-0">{t('lg.couponPending')}</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] px-2 shrink-0"
                          disabled={couponPending === s.supplierId}
                          onClick={() => handleRequestCoupon(s.supplierId)}
                        >
                          {couponPending === s.supplierId ? '…' : t('lg.couponReqBtn')}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{t('lg.noPreferred')}</span>{' '}
                {t('lg.noPreferredHint')}
              </p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground leading-snug">
            {t('lg.joinHint')}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-muted-foreground">{t('lg.peerLabel')}</span>
              <span className="text-sm font-bold text-foreground">{status.peerCount} / {status.threshold}명</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {eligible && status.institution ? (
            <div className="space-y-2">
              <Input
                placeholder={`${t('lg.createBtn').replace('🧪 ', '')} (${status.institution} ${status.department ?? ''})`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
              <Button onClick={claim} disabled={pending} className="w-full">
                {pending ? t('lg.creating') : t('lg.createBtn')}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('lg.needMore').replace('{n}', String(Math.max(0, status.threshold - status.peerCount)))}
            </p>
          )}

          {err && <p className="text-xs text-destructive mt-2">{err}</p>}

          {/* 단골 공급사 없을 때 초대 CTA */}
          {!hasPreferred && (
            <div className="mt-3 rounded-lg border border-dashed border-border p-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">단골 공급사가 없습니다.</span>{' '}
                아래 초대 코드로 공급사를 초대하면 단골 관계가 자동으로 형성됩니다.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
