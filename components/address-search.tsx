'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, MapPin } from 'lucide-react'
import type { JusoResult } from '@/app/api/juso/route'

interface Props {
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
}

export function AddressSearch({ value, onChange, label = '배송지', id }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JusoResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [baseAddr, setBaseAddr] = useState('')
  const [detail, setDetail] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync internal detail back to parent
  useEffect(() => {
    if (baseAddr) {
      onChange(detail ? `${baseAddr} ${detail}` : baseAddr)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseAddr, detail])

  // If parent value is cleared, reset internal state
  useEffect(() => {
    if (!value) { setBaseAddr(''); setDetail('') }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSearch() {
    if (query.length < 2) return
    setLoading(true)
    try {
      const res = await fetch(`/api/juso?keyword=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(juso: JusoResult) {
    setBaseAddr(juso.roadAddr)
    setDetail('')
    setQuery(juso.roadAddr)
    setOpen(false)
  }

  // If no Juso key, show plain input only
  if (!baseAddr) {
    return (
      <div className="space-y-1.5" ref={containerRef}>
        {label && <Label htmlFor={id}>{label}</Label>}

        {/* 검색 행 */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="도로명·건물명·지번으로 검색 (예: 관악로 1)"
                className="pl-8"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || query.length < 2}
              className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors shrink-0 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {loading ? '검색 중…' : '주소 검색'}
            </button>
          </div>

          {/* 드롭다운 */}
          {open && (
            <ul className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-border bg-background shadow-lg max-h-64 overflow-y-auto">
              {results.length === 0 ? (
                <li className="px-3 py-4 text-sm text-muted-foreground text-center">
                  검색 결과가 없습니다.
                </li>
              ) : results.map((item, idx) => (
                <li
                  key={idx}
                  onMouseDown={() => handleSelect(item)}
                  className="flex cursor-pointer flex-col px-3 py-2.5 text-sm hover:bg-muted border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-xs font-mono shrink-0">
                      {item.zipNo}
                    </span>
                    <span className="font-medium">{item.roadAddr}</span>
                  </div>
                  {item.jibunAddr && (
                    <span className="text-xs text-muted-foreground mt-0.5 ml-1">{item.jibunAddr}</span>
                  )}
                  {item.bdNm && (
                    <span className="text-xs text-muted-foreground ml-1">{item.bdNm}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 직접 입력 fallback */}
        <Input
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="주소를 직접 입력하거나 위 검색 버튼을 사용하세요"
        />
      </div>
    )
  }

  // After address selected — show base + detail inputs
  return (
    <div className="space-y-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm flex items-center justify-between gap-2">
        <div>
          <span className="font-medium">{baseAddr}</span>
        </div>
        <button
          type="button"
          onClick={() => { setBaseAddr(''); setDetail(''); setQuery(''); onChange('') }}
          className="text-xs text-muted-foreground hover:text-foreground shrink-0"
        >
          재검색
        </button>
      </div>

      <Input
        id={id}
        value={detail}
        onChange={e => setDetail(e.target.value)}
        placeholder="상세 주소 입력 (동·호수·층 등)"
        autoFocus
      />
    </div>
  )
}
