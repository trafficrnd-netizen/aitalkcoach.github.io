'use client'

import { ITEM_TYPE_ICONS, type ItemType } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/context'

interface Props {
  value: ItemType
  onChange: (type: ItemType) => void
}

const ITEM_TYPES: ItemType[] = ['reagent', 'protein', 'supply', 'equipment']

export function ItemTypeSelector({ value, onChange }: Props) {
  const t = useT()
  return (
    <div>
      <p className="text-sm font-medium mb-2">{t('it.label')} <span className="text-destructive">*</span></p>
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
            <span className="font-medium text-xs leading-tight">{t(`it.${type}`)}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{t(`it.desc.${type}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
