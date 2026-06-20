'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import {
  CATEGORY_TREE, ITEM_TYPE_ICONS, getCatLabel,
  searchCategories,
  type ItemType, type FlatCategory,
} from '@/lib/categories'

export interface SearchFilter {
  text: string
  category: FlatCategory | null
}

interface CategorySearchProps {
  onFilterChange: (filter: SearchFilter) => void
  placeholder?: string
  className?: string
}

const ITEM_TYPES = Object.keys(CATEGORY_TREE) as ItemType[]

function useDebounce<T>(val: T, delay: number): T {
  const [debounced, setDebounced] = useState(val)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(val), delay)
    return () => clearTimeout(timer)
  }, [val, delay])
  return debounced
}

export function CategorySearch({ onFilterChange, placeholder, className }: CategorySearchProps) {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeType, setActiveType] = useState<ItemType>('reagent')
  const [selectedCat, setSelectedCat] = useState<FlatCategory | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 200)

  const itypeLabel = (type: ItemType) => t(`itype.${type}`)
  const resolvedPlaceholder = placeholder ?? t('bd.searchPh')

  const suggestions = debouncedQuery.length >= 1 ? searchCategories(debouncedQuery) : []
  const isTyping = query.length > 0

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const applyFilter = useCallback((text: string, cat: FlatCategory | null) => {
    onFilterChange({ text, category: cat })
  }, [onFilterChange])

  function selectCategory(cat: FlatCategory) {
    setSelectedCat(cat)
    setQuery('')
    setOpen(false)
    applyFilter('', cat)
  }

  function clearCategory() {
    setSelectedCat(null)
    applyFilter(query, null)
    inputRef.current?.focus()
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setSelectedCat(null)
    applyFilter(val, null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'Enter') {
      if (isTyping && suggestions.length > 0) selectCategory(suggestions[0])
      else setOpen(false)
    }
  }

  function clearAll() {
    setQuery('')
    setSelectedCat(null)
    setOpen(false)
    applyFilter('', null)
    inputRef.current?.focus()
  }

  const hasValue = query.length > 0 || selectedCat !== null

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input row */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border bg-background px-3 py-2 transition-colors',
          open ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/40'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

        {selectedCat && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
            {ITEM_TYPE_ICONS[selectedCat.type]}
            {selectedCat.label}
            <button type="button" onClick={clearCategory} className="ml-0.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedCat ? t('catSearch.morePh') : resolvedPlaceholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
          autoComplete="off"
        />

        {hasValue && (
          <button type="button" onClick={clearAll} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-background shadow-xl overflow-hidden">

          {/* Autocomplete mode */}
          {isTyping && (
            <div>
              {suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t('catSearch.noMatch').replace('{query}', query)}
                </div>
              ) : (
                <>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('catSearch.suggest')}
                  </div>
                  {suggestions.map(cat => (
                    <button
                      key={cat.code}
                      type="button"
                      onMouseDown={() => selectCategory(cat)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                    >
                      <span className="text-base leading-none">{ITEM_TYPE_ICONS[cat.type]}</span>
                      <span className="flex-1 min-w-0">
                        <span className="font-medium">{cat.label}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{cat.breadcrumb}</span>
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-border mx-3 my-1" />
                  <button
                    type="button"
                    onMouseDown={() => { setOpen(false); applyFilter(query, null) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                  >
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {t('catSearch.textSearch').replace('{query}', query)}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Browse mode */}
          {!isTyping && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('catSearch.browse')}
              </div>

              {/* Type tabs */}
              <div className="flex border-b border-border">
                {ITEM_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); setActiveType(type) }}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors',
                      activeType === type
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-base">{ITEM_TYPE_ICONS[type]}</span>
                    <span className="leading-tight text-center">{itypeLabel(type)}</span>
                  </button>
                ))}
              </div>

              {/* Subcategories */}
              <div className="max-h-64 overflow-y-auto py-1">
                <button
                  type="button"
                  onMouseDown={() => selectCategory({
                    code: activeType,
                    label: itypeLabel(activeType),
                    breadcrumb: t('catSearch.all').replace('{type}', ''),
                    type: activeType,
                  })}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
                >
                  <span>{t('catSearch.all').replace('{type}', itypeLabel(activeType))}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>

                {CATEGORY_TREE[activeType].map(node => (
                  <div key={node.code}>
                    <button
                      type="button"
                      onMouseDown={() => selectCategory({
                        code: node.code,
                        label: node.label,
                        breadcrumb: itypeLabel(activeType),
                        type: activeType,
                      })}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-muted text-left"
                    >
                      <span className="font-medium">{getCatLabel(node, lang)}</span>
                      {node.children && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    </button>

                    {node.children && node.children.map(child => (
                      <button
                        key={child.code}
                        type="button"
                        onMouseDown={() => selectCategory({
                          code: child.code,
                          label: getCatLabel(child, lang),
                          breadcrumb: getCatLabel(node, lang),
                          type: activeType,
                        })}
                        className="flex w-full items-center px-6 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground text-left"
                      >
                        · {getCatLabel(child, lang)}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
