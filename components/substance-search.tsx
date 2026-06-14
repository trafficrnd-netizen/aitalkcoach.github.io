'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SubstanceResult } from '@/app/api/substances/search/route'
import { checkRegulated, type RegulatedSubstance } from '@/lib/regulated-substances'
import { TriangleAlert, ShieldAlert } from 'lucide-react'

interface SubstanceSearchProps {
  onSelect: (substance: SubstanceResult) => void
  onRegulationChange?: (reg: RegulatedSubstance | null) => void
  label?: string
  placeholder?: string
  className?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const LEVEL_STYLE = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
}

const LEVEL_LABEL = {
  high:   '고위험',
  medium: '관리대상',
}

export function SubstanceSearch({
  onSelect,
  onRegulationChange,
  label = '물질 검색',
  placeholder = 'CAS 번호 또는 물질명 입력 (예: 64-17-5, ethanol)',
  className,
}: SubstanceSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SubstanceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selectedReg, setSelectedReg] = useState<RegulatedSubstance | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 350)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/substances/search?q=${encodeURIComponent(q)}`)
      const data: SubstanceResult[] = await res.json()
      setResults(data)
      setOpen(data.length > 0)
      setActiveIndex(-1)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    search(debouncedQuery)
  }, [debouncedQuery, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function handleSelect(substance: SubstanceResult) {
    setQuery(substance.casNumber ?? substance.name)
    setOpen(false)
    onSelect(substance)

    const reg = checkRegulated(substance.casNumber)
    setSelectedReg(reg)
    onRegulationChange?.(reg)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <div className="relative">
        <Input
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            // 수동 입력 시 이전 경고 초기화
            if (selectedReg) {
              setSelectedReg(null)
              onRegulationChange?.(null)
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          {results.map((item, idx) => {
            const reg = item.casNumber ? checkRegulated(item.casNumber) : null
            return (
              <li
                key={item.cid}
                onMouseDown={() => handleSelect(item)}
                className={cn(
                  'flex cursor-pointer flex-col px-3 py-2.5 text-sm transition-colors',
                  idx === activeIndex ? 'bg-primary/10' : 'hover:bg-muted',
                  idx !== results.length - 1 && 'border-b border-border'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{item.name || item.iupacName}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {reg && (
                      <span className={cn(
                        'inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                        LEVEL_STYLE[reg.level]
                      )}>
                        <ShieldAlert className="h-2.5 w-2.5" />
                        {LEVEL_LABEL[reg.level]}
                      </span>
                    )}
                    {item.casNumber && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-mono">
                        {item.casNumber}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                  {item.molecularFormula && <span>{item.molecularFormula}</span>}
                  {item.molecularWeight && <span>MW: {item.molecularWeight}</span>}
                  {reg && (
                    <span className="text-muted-foreground">{reg.regs.join(' · ')}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* 선택 후 인라인 경고 */}
      {selectedReg && (
        <div className={cn(
          'mt-2 flex items-start gap-2 rounded-md border px-3 py-2.5 text-xs leading-snug',
          selectedReg.level === 'high'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        )}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">
              {selectedReg.level === 'high' ? '고위험 규제물질' : '관리대상 물질'}
            </span>
            {' — '}
            {selectedReg.regs.join(', ')} 규제 적용
            {selectedReg.level === 'high' && (
              <span className="block mt-0.5">취급 전 기관 허가 및 안전관리 규정을 반드시 확인하세요.</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
