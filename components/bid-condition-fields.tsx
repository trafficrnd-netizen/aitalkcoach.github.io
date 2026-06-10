'use client'

import { useState } from 'react'
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
  const [demoAvailable, setDemoAvailable] = useState<'' | 'yes' | 'no'>('')
  const [sampleAvailable, setSampleAvailable] = useState<'' | 'yes' | 'no'>('')

  return (
    <div className="space-y-4">
      {/* ── 해외 공급사 조건 명시 ───────────────────────────── */}
      {ctx.isOverseas && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Globe2 className="h-4 w-4" /> 해외 공급 조건 명시 (연구자 의사결정용)
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            통관·관세·인증 등 국내 거래와 다른 조건을 미리 명확히 제시해야 분쟁을 예방할 수 있습니다.
          </p>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              예상 납기 <span className="text-destructive">*</span>
              <span className="text-xs font-normal text-muted-foreground ml-1">(통관 기간 포함, 일수)</span>
            </label>
            <Input type="number" name="leadTimeDays" min={1} placeholder="예: 21" required className="max-w-xs" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              관세·수입부가세 <span className="text-destructive">*</span>
            </label>
            <select name="customsDutyIncluded" required className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm">
              <option value="">선택하세요</option>
              <option value="true">견적가에 포함 (연구자 추가 부담 없음)</option>
              <option value="false">별도 (연구자/기관 부담)</option>
            </select>
          </div>

          {ctx.hasEquipment && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" name="certResponsibilityAck" value="true" required className="h-4 w-4 accent-primary mt-0.5" />
              <span className="text-[11px] text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">[필수] KC·전기용품 안전인증 책임 확인</span><br />
                공급 장비의 KC인증·전기용품 안전인증 취득·유지 책임이 전적으로 당사(공급사)에 있음을 확인합니다.
              </span>
            </label>
          )}
        </div>
      )}

      {/* ── 장비: 데모 ──────────────────────────────────────── */}
      {ctx.hasEquipment && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Wrench className="h-4 w-4" /> 장비 데모
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              데모 사용 가능 여부 <span className="text-destructive">*</span>
            </label>
            <select
              name="demoAvailable"
              required
              value={demoAvailable}
              onChange={e => setDemoAvailable(e.target.value as 'yes' | 'no')}
              className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">선택하세요</option>
              <option value="yes">데모 제공 가능</option>
              <option value="no">데모 불가</option>
            </select>
          </div>
          {demoAvailable === 'yes' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                데모 기간 <span className="text-destructive">*</span>
                <span className="text-xs font-normal text-muted-foreground ml-1">(일수 — 평가 기한에 반영됩니다)</span>
              </label>
              <Input type="number" name="demoDays" min={1} max={90} placeholder="예: 14" required className="max-w-xs" />
            </div>
          )}
        </div>
      )}

      {/* ── 시약/단백질·펩타이드: 샘플 ──────────────────────── */}
      {ctx.hasReagentOrBio && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <FlaskConical className="h-4 w-4" /> 샘플 제공 (시약·단백질·펩타이드)
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              샘플 제공 여부 <span className="text-destructive">*</span>
            </label>
            <select
              name="sampleAvailable"
              required
              value={sampleAvailable}
              onChange={e => setSampleAvailable(e.target.value as 'yes' | 'no')}
              className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">선택하세요</option>
              <option value="yes">샘플 제공 가능</option>
              <option value="no">샘플 제공 불가</option>
            </select>
          </div>
          {sampleAvailable === 'yes' && (
            <p className="flex items-start gap-2 text-[11px] text-secondary leading-snug">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              샘플 사용 후 연구자가 피드백을 제출하면 연구자에게 크레딧 2점이 적립됩니다 — 피드백 확률이 높아집니다.
            </p>
          )}
        </div>
      )}

      {/* ── 기타 조건 ──────────────────────────────────────── */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">기타 제시 조건 (선택)</label>
        <Input name="conditionsNote" placeholder="MOQ, 보관 조건, 설치 지원, 보증 등" />
      </div>
    </div>
  )
}
