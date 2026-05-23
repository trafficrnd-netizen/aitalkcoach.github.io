'use client'

import { ITEM_TYPE_LABELS, ITEM_TYPE_ICONS, type ItemType } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface Props {
  value: ItemType
  onChange: (type: ItemType) => void
}

const ITEM_TYPES: ItemType[] = ['reagent', 'protein', 'supply', 'equipment']

const DESCRIPTIONS: Record<ItemType, string> = {
  reagent: 'CAS번호·순도 기반 화학·바이오 시약',
  protein: '항체·재조합 단백질·분석 키트 등',
  supply: '소모품, 플라스틱, 유리기구, 필터 등',
  equipment: '원심분리기, PCR, 현미경 등 장비',
}

export function ItemTypeSelector({ value, onChange }: Props) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">품목 유형 <span className="text-destructive">*</span></p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ITEM_TYPES.map(type => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-sm transition-colors text-center',
              value === type
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-background text-foreground hover:border-muted-foreground'
            )}
          >
            <span className="text-xl">{ITEM_TYPE_ICONS[type]}</span>
            <span className="font-medium text-xs leading-tight">{ITEM_TYPE_LABELS[type]}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{DESCRIPTIONS[type]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
