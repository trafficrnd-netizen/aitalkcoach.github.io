'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { useT } from '@/lib/i18n/context'
import { AESTHETIC_TYPES, AESTHETIC_TREE } from '@/lib/aesthetic/catalog'
import { searchAestheticAds, logAdEvent, type AdSearchResult } from '@/lib/actions/ad-search'
import { Search, ShieldCheck, Phone, Sparkles } from 'lucide-react'

/**
 * BidVibe Medi — 공급사 디렉터리(광고판) 검색.
 * 수요자가 카테고리/키워드로 인증 공급사를 발견한다(발견·신뢰 레이어).
 * 전화 견적 버튼 옆에 '비공개 최저가로 요청(무료)' 넛지를 더 강조해 플랫폼 거래로 유도.
 */
export default function MediFindPage() {
  const t = useT()
  const [category, setCategory] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<AdSearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function run(cat: string, kw: string) {
    setLoading(true)
    try {
      setResults(await searchAestheticAds({ category: cat || undefined, keyword: kw || undefined }))
    } finally {
      setLoading(false)
    }
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    run(category, keyword)
  }

  function pickCategory(code: string) {
    const next = category === code ? '' : code
    setCategory(next)
    run(next, keyword)
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-extrabold">{t('medi.brand')}</span>
      </div>
      <h1 className="text-2xl font-black tracking-tight">{t('medi.find.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('medi.find.sub')}</p>

      {/* 검색창 */}
      <form onSubmit={onSearch} className="mt-5 flex gap-2">
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder={t('medi.find.searchPh')}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button type="submit" className={buttonVariants({ size: 'lg' })}>
          <Search className="h-4 w-4" /> {t('medi.find.searchBtn')}
        </button>
      </form>

      {/* 카테고리 칩 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {AESTHETIC_TYPES.flatMap(type =>
          AESTHETIC_TREE[type].map(node => (
            <button
              key={node.code}
              type="button"
              onClick={() => pickCategory(node.code)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                category === node.code
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
              }`}
            >
              {node.label}
            </button>
          )),
        )}
      </div>

      {/* 결과 */}
      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-muted-foreground">{t('medi.find.loading')}</p>}
        {!loading && results && results.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('medi.find.empty')}</p>
        )}
        {!loading && results?.map(ad => (
          <div key={ad.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-sm flex items-center gap-1.5">
                {ad.title}
                {ad.verified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> {t('medi.find.verified')}
                  </span>
                )}
              </div>
              {ad.regions.length > 0 && (
                <span className="text-[11px] text-muted-foreground shrink-0">{ad.regions.join(' · ')}</span>
              )}
            </div>
            {ad.description && <p className="mt-1 text-xs text-muted-foreground leading-snug">{ad.description}</p>}
            {ad.products.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {ad.products.slice(0, 8).map(p => (
                  <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/signup/researcher?v=aesthetic"
                onClick={() => logAdEvent(ad.id, 'request_click')}
                className={buttonVariants({ size: 'sm' })}
              >
                {t('medi.find.requestCta')}
              </Link>
              {ad.contactInfo && (
                <a
                  href={`tel:${ad.contactInfo.replace(/[^0-9+]/g, '')}`}
                  onClick={() => logAdEvent(ad.id, 'contact_click')}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  <Phone className="h-3.5 w-3.5" /> {t('medi.find.callCta')}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{t('medi.find.nudge')}</p>
    </main>
  )
}
