'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { claimSupplierReferralCode, type SupplierProgramStatus } from '@/lib/actions/supplier-program'
import { setPublicProfileEnabled } from '@/lib/actions/public-profile'
import { TIER_META } from '@/lib/tier'
import { useT } from '@/lib/i18n/context'
import { Copy, Check, Sparkles, Lock, ExternalLink, Zap, Trophy, Globe } from 'lucide-react'

interface Props {
  status: SupplierProgramStatus
}

export function SupplierProgramWidget({ status: initial }: Props) {
  const t = useT()
  const [status, setStatus] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eligible = status.count >= status.threshold
  // 진행 게이지는 다음 티어를 향해 계산 (없으면 100%)
  const tierMeta = status.tier ? TIER_META[status.tier] : null
  const nextThreshold = status.nextTierIn != null ? status.count + status.nextTierIn : status.count
  const segmentBase = tierMeta ? tierMeta.min : 0
  const segmentTop = status.nextTierIn != null ? nextThreshold : status.threshold
  const pct = segmentTop > segmentBase
    ? Math.min(100, Math.round(((status.count - segmentBase) / (segmentTop - segmentBase)) * 100))
    : 100

  function claim() {
    setError(null)
    startTransition(async () => {
      const res = await claimSupplierReferralCode()
      if (!res.ok) {
        setError(res.reason === 'threshold_not_met'
          ? t('spw.errThreshold').replace('{a}', String(res.count ?? 0)).replace('{b}', String(status.threshold))
          : t('spw.errIssue').replace('{reason}', String(res.reason)))
        return
      }
      setStatus({
        ...status,
        code: res.code,
        shareUrl: `https://ai-traffic.kr/p/${res.code}`,
        effective: status.earlybirdActive || !status.isFreePlan,
      })
    })
  }

  const [pubEnabled, setPubEnabled] = useState(status.publicProfileEnabled)
  function togglePublic() {
    const next = !pubEnabled
    setPubEnabled(next)
    setPublicProfileEnabled(next).catch(() => setPubEnabled(!next))
  }

  async function copy() {
    if (!status.shareUrl) return
    try {
      await navigator.clipboard.writeText(status.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* 무시 */ }
  }

  return (
    <div className="rounded-xl border-2 border-accent/40 bg-gradient-to-br from-accent/5 to-secondary/5 p-5">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <Sparkles className="h-4 w-4 text-accent-foreground" />
        <h3 className="font-bold text-foreground">{t('spw.title')}</h3>
        {status.earlybirdActive && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/30 text-accent-foreground">{t('spw.earlybird')}</span>
        )}
        {tierMeta && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{ borderColor: tierMeta.color, color: tierMeta.color, background: `${tierMeta.color}15` }}>
            <Trophy className="h-2.5 w-2.5" /> {tierMeta.label}
          </span>
        )}
        {status.responseStats?.fastResponder && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-secondary text-secondary bg-secondary/10">
            <Zap className="h-2.5 w-2.5" /> {t('spw.fastResponse')}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t('spw.intro').replace('{n}', String(status.threshold))}
      </p>

      {/* 진행 게이지 — 다음 티어 향해 */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {status.nextTier ? t('spw.nextTier').replace('{tier}', TIER_META[status.nextTier].label) : t('spw.topTier')}
          </span>
          <span className="text-sm font-bold text-foreground">
            {status.count}{status.nextTierIn != null ? ` / ${nextThreshold}` : ''}{t('spw.peopleSuffix')}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: tierMeta?.color ?? '#F4A261' }}
          />
        </div>
      </div>

      {/* 응답 통계 */}
      {status.responseStats && status.responseStats.bids > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <div className="text-muted-foreground">{t('spw.resp30d')}</div>
            <div className="font-bold text-foreground">
              {t('spw.respAvg').replace('{m}', String(status.responseStats.avgMinutes)).replace('{b}', String(status.responseStats.bids))}
            </div>
          </div>
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <div className="text-muted-foreground">{t('spw.fastBadge')}</div>
            <div className={`font-bold ${status.responseStats.fastResponder ? 'text-secondary' : 'text-foreground/60'}`}>
              {status.responseStats.fastResponder ? t('spw.fastHave') : t('spw.fastNeed')}
            </div>
          </div>
        </div>
      )}

      {/* 코드 영역 */}
      {status.code ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">{t('spw.issuedCode')}</span>
              <span className="text-[11px] text-muted-foreground">
                {t('spw.followReq').replace('{f}', String(status.followers)).replace('{r}', String(status.requestsViaCode))}
              </span>
            </div>
            <div className="font-mono text-2xl font-extrabold tracking-widest text-primary text-center py-1">
              {status.code}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copy} className="flex-1">
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? t('spw.copied') : t('spw.copyLink')}
            </Button>
            {status.shareUrl && (
              <a href={status.shareUrl} target="_blank" rel="noreferrer"
                 className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 text-xs hover:bg-muted">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {!status.effective && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                {t('spw.inactivePre')}<strong>{t('spw.inactiveStrong')}</strong>{t('spw.inactivePost')}
              </span>
            </div>
          )}
        </div>
      ) : eligible ? (
        <Button onClick={claim} disabled={pending} className="w-full">
          {pending ? t('spw.issuing') : t('spw.claimBtn')}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t('spw.needMore').replace('{n}', String(status.threshold - status.count))}
        </p>
      )}

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}

      {!status.earlybirdActive && status.isFreePlan && !status.code && (
        <p className="text-[10px] text-muted-foreground mt-3 leading-snug">
          {t('spw.earlybirdNote')}
        </p>
      )}

      {/* 공개 프로필 (/s/code) — 인증 + 티어 보유 시 노출 */}
      {status.publicEligible && (
        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Globe className="h-3.5 w-3.5 text-secondary" /> {t('spw.publicProfile')}
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input type="checkbox" checked={pubEnabled} onChange={togglePublic} className="h-3.5 w-3.5 accent-secondary" />
              {pubEnabled ? t('spw.public') : t('spw.private')}
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug mb-2">
            {t('spw.publicDesc')}
          </p>
          {pubEnabled && status.publicProfileUrl && (
            <a href={status.publicProfileUrl} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1 text-xs text-secondary hover:underline">
              <ExternalLink className="h-3 w-3" /> {status.publicProfileUrl.replace('https://', '')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
