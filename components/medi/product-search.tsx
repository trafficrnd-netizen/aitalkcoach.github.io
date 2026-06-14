'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Loader2, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AESTHETIC_TREE,
  AESTHETIC_TYPES,
  AESTHETIC_TYPE_LABELS,
  AESTHETIC_TYPE_ICONS,
  type AestheticType,
} from '@/lib/aesthetic/catalog'
import type { MediProductResult } from '@/app/api/medi/products/search/route'

// ── 타입 ──────────────────────────────────────────────────────────────────────

export interface ProductResult {
  code: string          // 카탈로그 코드 (예: device.cartridge)
  label: string         // 표시 이름
  type: AestheticType
  typeLabel: string
  brand?: string | null
  unit?: string | null  // spec.unit 값 (자동 채움용)
  isDbProduct?: boolean // DB에서 온 제품 여부
}

// ── 정적 카탈로그 플랫 리스트 ───────────────────────────────────────────────

const ALL_CATEGORIES: ProductResult[] = AESTHETIC_TYPES.flatMap(type =>
  AESTHETIC_TREE[type].map(node => ({
    code: node.code,
    label: node.label,
    type,
    typeLabel: AESTHETIC_TYPE_LABELS[type],
    isDbProduct: false,
  }))
)

// ── 디바운스 훅 ───────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── 카테고리 코드 → AestheticType 변환 ──────────────────────────────────────

function typeFromCategory(category: string): AestheticType {
  const prefix = category.split('.')[0] as AestheticType
  return AESTHETIC_TYPES.includes(prefix) ? prefix : 'device'
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (result: ProductResult) => void
  filterType?: AestheticType
  placeholder?: string
  className?: string
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export function ProductSearch({
  value,
  onChange,
  onSelect,
  filterType,
  placeholder = '제품 검색 (예: 카트리지, 니들...)',
  className,
}: ProductSearchProps) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debouncedQ = useDebounce(value, 280)

  // 클릭 외부 닫기
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // DB 검색 + 정적 카탈로그 검색 병합
  const search = useCallback(async (q: string) => {
    const trimmed = q.trim()

    // 빈 쿼리 → 카테고리 8개 표시
    if (trimmed.length === 0) {
      const cats = filterType
        ? ALL_CATEGORIES.filter(c => c.type === filterType)
        : ALL_CATEGORIES
      setResults(cats.slice(0, 8))
      setOpen(true)
      return
    }

    setLoading(true)
    try {
      // 1) DB 검색
      const url = `/api/medi/products/search?q=${encodeURIComponent(trimmed)}${filterType ? `&type=${filterType}` : ''}`
      const res = await fetch(url)
      const dbProducts: MediProductResult[] = res.ok ? await res.json() : []

      const dbResults: ProductResult[] = dbProducts.map(p => ({
        code: p.category,
        label: p.name,
        type: typeFromCategory(p.category),
        typeLabel: AESTHETIC_TYPE_LABELS[typeFromCategory(p.category)],
        brand: p.brand,
        unit: typeof p.spec?.unit === 'string' ? p.spec.unit : null,
        isDbProduct: true,
      }))

      // 2) 정적 카탈로그 (DB에 없는 보조 매칭)
      const lower = trimmed.toLowerCase()
      const cats = ALL_CATEGORIES.filter(c => {
        if (filterType && c.type !== filterType) return false
        return c.label.toLowerCase().includes(lower) || c.typeLabel.toLowerCase().includes(lower)
      })

      // DB 결과 우선, 카테고리는 최대 3개 보충
      const merged: ProductResult[] = [
        ...dbResults,
        ...cats.filter(c => !dbResults.some(d => d.code === c.code)).slice(0, 3),
      ].slice(0, 12)

      setResults(merged)
      setOpen(merged.length > 0)
    } catch {
      // 네트워크 오류 시 정적 카탈로그만
      const lower = trimmed.toLowerCase()
      const cats = ALL_CATEGORIES.filter(c =>
        c.label.toLowerCase().includes(lower) || c.typeLabel.toLowerCase().includes(lower)
      )
      setResults(cats.slice(0, 8))
      setOpen(cats.length > 0)
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    search(debouncedQ)
  }, [debouncedQ, search])

  function handleInput(q: string) {
    onChange(q)
  }

  function handleSelect(r: ProductResult) {
    onChange(r.label)
    onSelect?.(r)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin pointer-events-none" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <input
          type="text"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => search(value)}
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
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <li key={`${r.code}-${r.label}-${i}`}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(r) }}
                className="flex w-full items-start gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
              >
                <span className="text-base leading-none mt-0.5 shrink-0">{AESTHETIC_TYPE_ICONS[r.type]}</span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{r.label}</span>
                  {r.brand && (
                    <span className="block text-[11px] text-muted-foreground">{r.brand}</span>
                  )}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {r.isDbProduct && (
                    <Database className="h-2.5 w-2.5 text-teal-500" aria-label="DB 제품" />
                  )}
                  <span className="text-[10px] text-muted-foreground">{r.typeLabel}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
