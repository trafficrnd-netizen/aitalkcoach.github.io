'use client'

import { EQUIPMENT_SPEC_FIELDS, EQUIPMENT_SUB_TYPE_LABELS, type EquipmentSubType } from '@/lib/equipment-specs'
import { EQUIPMENT_KEYWORDS } from '@/lib/equipment-keywords'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const SUB_TYPES = Object.keys(EQUIPMENT_SUB_TYPE_LABELS) as EquipmentSubType[]

interface Props {
  subType: EquipmentSubType | ''
  setSubType: (v: EquipmentSubType) => void
  specs: Record<string, string>
  setSpec: (key: string, value: string) => void
  onKeywordSelect?: (keyword: string) => void
}

export function EquipmentFields({ subType, setSubType, specs, setSpec, onKeywordSelect }: Props) {
  const fields = subType ? EQUIPMENT_SPEC_FIELDS[subType] : []
  const keywords = subType ? EQUIPMENT_KEYWORDS[subType] ?? [] : []

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">장비 스펙 정보</p>

      {/* 장비 대분류 선택 */}
      <div className="space-y-1.5">
        <Label className="text-sm">장비 유형 <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SUB_TYPES.map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setSubType(st)}
              className={cn(
                'rounded-md border px-3 py-2 text-xs text-center transition-colors',
                subType === st
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border bg-background text-foreground hover:border-muted-foreground'
              )}
            >
              {EQUIPMENT_SUB_TYPE_LABELS[st]}
            </button>
          ))}
        </div>
        <input type="hidden" name="itemSubType" value={subType} />
      </div>

      {/* 선택된 장비 유형의 동적 스펙 필드 */}
      {subType && fields.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map(field => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-sm">
                  {field.label}
                  {field.unit && <span className="ml-1 text-xs text-muted-foreground">({field.unit})</span>}
                  {field.required && <span className="ml-1 text-destructive">*</span>}
                </Label>

                {field.fieldType === 'number' && (
                  <Input
                    type="number"
                    placeholder="숫자 입력"
                    value={specs[field.key] ?? ''}
                    onChange={e => setSpec(field.key, e.target.value)}
                  />
                )}

                {field.fieldType === 'text' && (
                  <Input
                    placeholder="텍스트 입력"
                    value={specs[field.key] ?? ''}
                    onChange={e => setSpec(field.key, e.target.value)}
                  />
                )}

                {field.fieldType === 'select' && field.options && (
                  <Select
                    value={specs[field.key] ?? ''}
                    onValueChange={v => setSpec(field.key, v ?? '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.fieldType === 'multiselect' && field.options && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map(opt => {
                      const selected = (specs[field.key] ?? '').split(',').filter(Boolean)
                      const isOn = selected.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const next = isOn
                              ? selected.filter(v => v !== opt.value)
                              : [...selected, opt.value]
                            setSpec(field.key, next.join(','))
                          }}
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                            isOn
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background hover:border-primary'
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* hidden input for form submission */}
                <input type="hidden" name={`spec_${field.key}`} value={specs[field.key] ?? ''} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 추천 제품 키워드 칩 */}
      {subType && keywords.length > 0 && onKeywordSelect && (
        <div className="space-y-1.5 pt-1">
          <Label className="text-sm">추천 장비 <span className="text-xs text-muted-foreground">(클릭 시 장비명 자동 입력)</span></Label>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map(kw => (
              <button
                key={kw}
                type="button"
                onClick={() => onKeywordSelect(kw)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  specs['device_name'] === kw
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

      {/* 브랜드 희망 (공통) */}
      {subType && (
        <div className="space-y-1.5 pt-1">
          <Label className="text-sm">희망 브랜드 <span className="text-xs text-muted-foreground">(선택)</span></Label>
          <Input
            name="equipmentBrand"
            value={specs['brand'] ?? ''}
            onChange={e => setSpec('brand', e.target.value)}
            placeholder="예: Eppendorf, Thermo, Zeiss 등"
          />
        </div>
      )}
    </div>
  )
}
