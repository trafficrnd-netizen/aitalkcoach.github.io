'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  SUPPLY_TOP_TYPES,
  SUPPLY_SUB_CATEGORIES,
  SUPPLY_KEYWORDS,
  type SupplyTopType,
} from '@/lib/supply-keywords'
import { cn } from '@/lib/utils'

interface Props {
  topType: SupplyTopType | ''
  setTopType: (v: SupplyTopType) => void
  subCode: string
  setSubCode: (v: string) => void
  productName: string
  setProductName: (v: string) => void
}

export function SupplyFields({
  topType,
  setTopType,
  subCode,
  setSubCode,
  productName,
  setProductName,
}: Props) {
  const subCategories = topType ? SUPPLY_SUB_CATEGORIES[topType] : []
  const keywords = subCode ? SUPPLY_KEYWORDS[subCode] ?? [] : []

  function handleTopTypeChange(v: SupplyTopType) {
    setTopType(v)
    setSubCode('')
    setProductName('')
  }

  function handleSubCodeChange(v: string) {
    setSubCode(v)
    setProductName('')
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">소모품·실험기구 선택</p>

      {/* Step 1: 소모품 vs 실험기구 */}
      <div className="space-y-1.5">
        <Label className="text-sm">대분류 <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-2 gap-2">
          {SUPPLY_TOP_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTopTypeChange(t.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-2.5 text-center transition-colors',
                topType === t.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background text-foreground hover:border-primary/40'
              )}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{t.desc}</span>
            </button>
          ))}
        </div>
        <input type="hidden" name="supplyTopType" value={topType} />
      </div>

      {/* Step 2: 세부 카테고리 */}
      {topType && (
        <div className="space-y-1.5">
          <Label className="text-sm">세부 분류 <span className="text-destructive">*</span></Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subCategories.map(sub => (
              <button
                key={sub.code}
                type="button"
                onClick={() => handleSubCodeChange(sub.code)}
                className={cn(
                  'rounded-md border px-3 py-2 text-xs text-center transition-colors',
                  subCode === sub.code
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border bg-background text-foreground hover:border-muted-foreground'
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="supplySubCode" value={subCode} />
        </div>
      )}

      {/* Step 3: 키워드 칩 */}
      {keywords.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-sm">추천 제품 <span className="text-xs text-muted-foreground">(클릭 시 제품명 자동 입력)</span></Label>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map(kw => (
              <button
                key={kw}
                type="button"
                onClick={() => setProductName(kw)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  productName === kw
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary'
                )}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: 제품명 직접 입력 */}
      {topType && (
        <div className="space-y-1.5">
          <Label className="text-sm">제품명 <span className="text-destructive">*</span></Label>
          <Input
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder={
              subCode
                ? '위 추천 제품을 클릭하거나 직접 입력하세요'
                : '세부 분류 선택 후 입력하세요'
            }
          />
          {productName && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setProductName('')}
            >
              지우기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
