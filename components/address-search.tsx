'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import type { JusoResult } from '@/app/api/juso/route'

interface Props {
  value: string
  onChange: (value: string) => void
  /** 도시(시·도 + 시군구)를 선택 시 부모에 전달 — 대리점 권역용 */
  onCityChange?: (city: string) => void
  label?: string
  id?: string
}

export function AddressSearch({ value, onChange, onCityChange, label = '배송지', id }: Props) {
  const { lang, t } = useI18n()
  const isKorean = lang === 'ko'

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

  // ── 영어 모드: 일반 텍스트 입력만 ──────────────────────────
  if (!isKorean) {
    return (
      <div className="space-y-1.5">
        {label && <Label htmlFor={id}>{t('addr.label')}</Label>}
        <Input
          id={id}
          value={value}
          onChange={e => {
            onChange(e.target.value)
            if (onCityChange) onCityChange(e.target.value)
          }}
          placeholder={t('addr.textPh')}
        />
        <p className="text-xs text-muted-foreground">{t('addr.textNote')}</p>
      </div>
    )
  }

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
    // 도시(시·도 + 시군구) 추출 — 대리점 권역
    if (onCityChange) {
      const city = [juso.siNm, juso.sggNm].filter(Boolean).join(' ').trim()
      if (city) onCityChange(city)
    }
  }

  // If no Juso key, show plain input only
  if (!baseAddr) {
    return (
      <div className="space-y-1.5" ref={containerRef}>
        {label && <Label htmlFor={id}>{label}</Label>}

        {/* 검색 입력 */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
            placeholder="도로명·지번 주소 검색"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || query.length < 2}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-muted px-3 text-sm hover:bg-muted/80 disabled:opacity-50"
          >
            <Search className="h-3.5 w-3.5" />
            {loading ? '검색중…' : '검색'}
          </button>
        </div>

        {open && results.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-background shadow-md">
            {results.map(item => (
              <li
                key={item.roadAddr}
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
