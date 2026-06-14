'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AESTHETIC_TREE,
  AESTHETIC_TYPES,
  AESTHETIC_TYPE_LABELS,
  AESTHETIC_TYPE_ICONS,
  type AestheticType,
} from '@/lib/aesthetic/catalog'

interface ProductResult {
  code: string
  label: string
  type: AestheticType
  typeLabel: string
}

// 전체 카탈로그 플랫 리스트
const ALL_PRODUCTS: ProductResult[] = AESTHETIC_TYPES.flatMap(type =>
  AESTHETIC_TREE[type].map(node => ({
    code: node.code,
    label: node.label,
    type,
    typeLabel: AESTHETIC_TYPE_LABELS[type],
  }))
)

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (result: ProductResult) => void
  placeholder?: string
  className?: string
}

export function ProductSearch({
  value,
  onChange,
  onSelect,
  placeholder = '제품 검색 (예: 카트리지, 니들...)',
  className,
}: ProductSearchProps) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<ProductResult[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleInput(q: string) {
    onChange(q)
    if (q.trim().length === 0) {
      setResults(ALL_PRODUCTS.slice(0, 8))
      setOpen(true)
      return
    }
    const lower = q.toLowerCase()
    const filtered = ALL_PRODUCTS.filter(p =>
      p.label.toLowerCase().includes(lower) || p.typeLabel.toLowerCase().includes(lower)
    )
    setResults(filtered.slice(0, 10))
    setOpen(true)
  }

  function handleSelect(r: ProductResult) {
    onChange(r.label)
    onSelect?.(r)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => handleInput(value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-input bg-background pl-9 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-60 overflow-y-auto">
          {results.map(r => (
            <li key={r.code}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(r) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
              >
                <span className="text-base leading-none">{AESTHETIC_TYPE_ICONS[r.type]}</span>
                <span className="flex-1 truncate">{r.label}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{r.typeLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
