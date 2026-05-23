'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { SubstanceSearch } from '@/components/substance-search'
import type { SubstanceResult } from '@/app/api/substances/search/route'
import { ITEM_TYPE_LABELS, ITEM_TYPE_ICONS, CATEGORY_TREE, type ItemType } from '@/lib/categories'
import { PROTEIN_KEYWORDS, PROTEIN_GENERAL_KEYWORDS } from '@/lib/protein-keywords'
import { EQUIPMENT_SUB_TYPE_LABELS, type EquipmentSubType } from '@/lib/equipment-specs'
import { EQUIPMENT_KEYWORDS } from '@/lib/equipment-keywords'
import {
  SUPPLY_TOP_TYPES,
  SUPPLY_SUB_CATEGORIES,
  SUPPLY_KEYWORDS,
  type SupplyTopType,
} from '@/lib/supply-keywords'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const UNITS = ['mL', 'L', 'g', 'kg', 'mg', 'μg', 'μL', 'ea', '박스', '기타']
const ITEM_TYPES: ItemType[] = ['reagent', 'protein', 'supply', 'equipment']
const EQUIP_SUB_TYPES = Object.keys(EQUIPMENT_SUB_TYPE_LABELS) as EquipmentSubType[]

export interface BatchItem {
  id: string
  itemType: ItemType
  itemSubType: string
  supplyTopType: SupplyTopType | ''
  substanceName: string
  casNumber: string
  qty: string
  unit: string
  purity: string
  volume: string
  note: string
}

export function emptyItem(): BatchItem {
  return {
    id: crypto.randomUUID(),
    itemType: 'reagent',
    itemSubType: '',
    supplyTopType: '',
    substanceName: '',
    casNumber: '',
    qty: '',
    unit: 'mL',
    purity: '',
    volume: '',
    note: '',
  }
}

interface BatchItemRowProps {
  index: number
  item: BatchItem
  onChange: (id: string, field: keyof BatchItem, value: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
}

export function BatchItemRow({ index, item, onChange, onRemove, canRemove }: BatchItemRowProps) {
  const [showSearch, setShowSearch] = useState(!item.substanceName)

  function handleSubstanceSelect(s: SubstanceResult) {
    onChange(item.id, 'substanceName', s.name || s.iupacName || '')
    onChange(item.id, 'casNumber', s.casNumber ?? '')
    setShowSearch(false)
  }

  function handleTypeChange(type: ItemType) {
    onChange(item.id, 'itemType', type)
    onChange(item.id, 'itemSubType', '')
    onChange(item.id, 'substanceName', '')
    onChange(item.id, 'casNumber', '')
    setShowSearch(true)
  }

  const proteinNodes = CATEGORY_TREE.protein

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* 행 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">품목 {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="행 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 품목 유형 선택 */}
      <div className="flex gap-1.5 flex-wrap">
        {ITEM_TYPES.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs transition-colors flex items-center gap-1',
              item.itemType === type
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:border-primary'
            )}
          >
            <span>{ITEM_TYPE_ICONS[type]}</span>
            <span>{ITEM_TYPE_LABELS[type]}</span>
          </button>
        ))}
      </div>

      {/* 단백질·펩타이드: 분류 + 키워드 칩 */}
      {item.itemType === 'protein' && (
        <div className="space-y-2">
          <Select value={item.itemSubType} onValueChange={v => onChange(item.id, 'itemSubType', v ?? '')}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="단백질·펩타이드 분류 선택" />
            </SelectTrigger>
            <SelectContent>
              {proteinNodes.map(parent => (
                <div key={parent.code}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{parent.label}</div>
                  {parent.children?.map(child => (
                    <SelectItem key={child.code} value={child.code} className="pl-5 text-sm">
                      {child.label}
                    </SelectItem>
                  )) ?? (
                    <SelectItem value={parent.code} className="pl-5 text-sm">{parent.label}</SelectItem>
                  )}
                </div>
              ))}
            </SelectContent>
          </Select>

          {/* 추천 키워드 칩 */}
          <div className="flex flex-wrap gap-1">
            {(item.itemSubType ? (PROTEIN_KEYWORDS[item.itemSubType] ?? []) : PROTEIN_GENERAL_KEYWORDS).slice(0, 10).map(kw => (
              <button
                key={kw}
                type="button"
                onClick={() => onChange(item.id, 'substanceName', kw)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                  item.substanceName === kw
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

      {/* 소모품·실험기구 */}
      {item.itemType === 'supply' && (
        <div className="space-y-2">
          {/* 대분류 */}
          <div className="grid grid-cols-2 gap-1.5">
            {SUPPLY_TOP_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  onChange(item.id, 'supplyTopType', t.value)
                  onChange(item.id, 'itemSubType', '')
                  onChange(item.id, 'substanceName', '')
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
                  item.supplyTopType === t.value
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border bg-background text-foreground hover:border-primary/40'
                )}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          {/* 세부 분류 */}
          {item.supplyTopType && (
            <div className="flex flex-wrap gap-1.5">
              {SUPPLY_SUB_CATEGORIES[item.supplyTopType as SupplyTopType].map(sub => (
                <button
                  key={sub.code}
                  type="button"
                  onClick={() => {
                    onChange(item.id, 'itemSubType', sub.code)
                    onChange(item.id, 'substanceName', '')
                  }}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                    item.itemSubType === sub.code
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:border-primary'
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
          {/* 키워드 칩 */}
          {item.itemSubType && SUPPLY_KEYWORDS[item.itemSubType]?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {SUPPLY_KEYWORDS[item.itemSubType].map(kw => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => onChange(item.id, 'substanceName', kw)}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                    item.substanceName === kw
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:border-primary'
                  )}
                >
                  {kw}
                </button>
              ))}
            </div>
          )}
          {/* 제품명 직접 입력 */}
          <Input
            value={item.substanceName}
            onChange={e => onChange(item.id, 'substanceName', e.target.value)}
            placeholder={item.itemSubType ? '위 추천 제품 클릭 또는 직접 입력' : '세부 분류 먼저 선택'}
          />
        </div>
      )}

      {/* 장비 서브타입 */}
      {item.itemType === 'equipment' && (
        <div className="space-y-2">
          <Select value={item.itemSubType} onValueChange={v => onChange(item.id, 'itemSubType', v ?? '')}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="장비 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {EQUIP_SUB_TYPES.map(st => (
                <SelectItem key={st} value={st}>{EQUIPMENT_SUB_TYPE_LABELS[st]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* 장비 키워드 칩 */}
          {item.itemSubType && EQUIPMENT_KEYWORDS[item.itemSubType as EquipmentSubType]?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {EQUIPMENT_KEYWORDS[item.itemSubType as EquipmentSubType].map(kw => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => onChange(item.id, 'substanceName', kw)}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                    item.substanceName === kw
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:border-primary'
                  )}
                >
                  {kw}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 물질/제품명 입력 — 시약은 CAS 검색, 단백질은 직접 입력 */}
      {item.itemType === 'reagent' && (showSearch ? (
        <SubstanceSearch
          label=""
          placeholder="CAS 번호 또는 물질명"
          onSelect={handleSubstanceSelect}
        />
      ) : (
        <div className="flex items-center justify-between rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
          <div className="text-sm">
            <span className="font-medium">{item.substanceName}</span>
            {item.casNumber && (
              <span className="ml-2 font-mono text-xs text-muted-foreground">{item.casNumber}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(item.id, 'substanceName', '')
              onChange(item.id, 'casNumber', '')
              setShowSearch(true)
            }}
            className="text-xs text-muted-foreground hover:text-foreground ml-2"
          >
            변경
          </button>
        </div>
      ))}

      {/* 단백질: 제품명 직접 입력 (키워드 칩 클릭 또는 수동) */}
      {item.itemType === 'protein' && (
        <Input
          value={item.substanceName}
          onChange={e => onChange(item.id, 'substanceName', e.target.value)}
          placeholder="위 추천 항목 클릭 또는 직접 입력"
        />
      )}

      {/* 장비: 장비명 직접 입력 */}
      {item.itemType === 'equipment' && (
        <Input
          value={item.substanceName}
          onChange={e => onChange(item.id, 'substanceName', e.target.value)}
          placeholder="장비명 입력 (예: 냉각 원심분리기)"
        />
      )}

      {/* 수량·단위·순도 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">수량 *</label>
          <Input
            type="number"
            min="0.001"
            step="any"
            value={item.qty}
            onChange={e => onChange(item.id, 'qty', e.target.value)}
            placeholder="500"
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">단위</label>
          <select
            value={item.unit}
            onChange={e => onChange(item.id, 'unit', e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {item.itemType === 'reagent' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">순도</label>
            <Input
              value={item.purity}
              onChange={e => onChange(item.id, 'purity', e.target.value)}
              placeholder="99.9%"
            />
          </div>
        )}
      </div>

      {/* 규격·비고 */}
      <div className="grid grid-cols-2 gap-2">
        {item.itemType === 'reagent' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">용량 규격</label>
            <Input
              value={item.volume}
              onChange={e => onChange(item.id, 'volume', e.target.value)}
              placeholder="500mL 병"
            />
          </div>
        )}
        <div className={item.itemType === 'reagent' ? '' : 'col-span-2'}>
          <label className="text-xs text-muted-foreground mb-1 block">품목 메모</label>
          <Input
            value={item.note}
            onChange={e => onChange(item.id, 'note', e.target.value)}
            placeholder="특이사항"
          />
        </div>
      </div>
    </div>
  )
}
