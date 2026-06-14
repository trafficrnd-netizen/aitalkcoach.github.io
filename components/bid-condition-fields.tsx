'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/context'
import { Input } from '@/components/ui/input'
import { Globe2, Wrench, FlaskConical, AlertTriangle } from 'lucide-react'

export interface BidContext {
  hasEquipment: boolean
  hasReagentOrBio: boolean
  isOverseas: boolean
}

/**
 * 입찰 조건 입력 필드 (단건·묶음 공용)
 * - 해외 공급사: 납기(통관 포함)·관세포함·인증책임 명시 필수
 * - 장비: 데모 가능 여부 + 기간(일) 필수
 * - 시약/단백질·펩타이드: 샘플 제공 여부 필수
 *
 * 모든 값은 hidden input 으로 폼에 포함되어 server action 으로 전달됩니다.
 */
export function BidConditionFields({ ctx }: { ctx: BidContext }) {
  const t = useT()
  const [demoAvailable, setDemoAvailable] = useState<'' | 'yes' | 'no'>('')
  const [sampleAvailable, setSampleAvailable] = useState<'' | 'yes' | 'no'>('')

  return (
    <div className="space-y-4">
      {/* ── 해외 공급사 조건 명시 ───────────────────────────── */}
      {ctx.isOverseas && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Globe2 className="h-4 w-4" /> {t('cond.overseas')}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {t('cond.overseasNote')}
          </p>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('cond.leadTime')} <span className="text-destructive">*</span>
              <span className="text-xs font-normal text-muted-foreground ml-1">{t('cond.leadTimeHint')}</span>
            </label>
            <Input type="number" name="leadTimeDays" min={1} placeholder={t('cond.leadTimePh')} required className="max-w-xs" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('cond.customs')} <span className="text-destructive">*</span>
            </label>
            <select name="customsDutyIncluded" required className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{t('cond.customsSelect')}</option>
              <option value="true">{t('cond.customsIncluded')}</option>
              <option value="false">{t('cond.customsExtra')}</option>
            </select>
          </div>

          {ctx.hasEquipment && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" name="certResponsibilityAck" value="true" required className="h-4 w-4 accent-primary mt-0.5" />
              <span className="text-[11px] text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">{t('cond.certAck')}</span><br />
                {t('cond.certAckNote')}
              </span>
            </label>
          )}
        </div>
      )}

      {/* ── 장비: 데모 ──────────────────────────────────────── */}
      {ctx.hasEquipment && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Wrench className="h-4 w-4" /> {t('cond.demoLabel')}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('cond.demoAvail')} <span className="text-destructive">*</span>
            </label>
            <select
              name="demoAvailable"
              required
              value={demoAvailable}
              onChange={e => setDemoAvailable(e.target.value as 'yes' | 'no')}
              className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t('cond.demoSelect')}</option>
              <option value="yes">{t('cond.demoYes')}</option>
              <option value="no">{t('cond.demoNo')}</option>
            </select>
          </div>
          {demoAvailable === 'yes' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t('cond.demoDays')} <span className="text-destructive">*</span>
                <span className="text-xs font-normal text-muted-foreground ml-1">{t('cond.demoDaysHint')}</span>
              </label>
              <Input type="number" name="demoDays" min={1} max={90} placeholder={t('cond.demoDaysPh')} required className="max-w-xs" />
            </div>
          )}
        </div>
      )}

      {/* ── 시약/단백질·펩타이드: 샘플 ──────────────────────── */}
      {ctx.hasReagentOrBio && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <FlaskConical className="h-4 w-4" /> {t('cond.sampleLabel')}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('cond.sampleAvail')} <span className="text-destructive">*</span>
            </label>
            <select
              name="sampleAvailable"
              required
              value={sampleAvailable}
              onChange={e => setSampleAvailable(e.target.value as 'yes' | 'no')}
              className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t('cond.demoSelect')}</option>
              <option value="yes">{t('cond.sampleYes')}</option>
              <option value="no">{t('cond.sampleNo')}</option>
            </select>
          </div>
          {sampleAvailable === 'yes' && (
            <p className="flex items-start gap-2 text-[11px] text-secondary leading-snug">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {t('cond.sampleCredit')}
            </p>
          )}
        </div>
      )}

      {/* ── 기타 조건 ──────────────────────────────────────── */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('cond.otherLabel')}</label>
        <Input name="conditionsNote" placeholder={t('cond.otherPh')} />
      </div>
    </div>
  )
}
