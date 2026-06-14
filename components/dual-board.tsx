'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { FileText, Megaphone, Clock, MapPin, ShoppingCart, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategorySearch, type SearchFilter } from '@/components/category-search'
import { useI18n } from '@/lib/i18n/context'

export type BoardRequest = {
  id: string
  title: string | null
  type: string
  deadline: string | null
  delivery_address: string | null
  created_at: string
  item_count: number
  bid_count: number
  delivery_city?: string | null
  is_group_buy?: boolean | null
  discount_requested?: boolean | null
}

export type BoardAd = {
  id: string
  supplier_id: string
  title: string
  description: string | null
  categories: string[]
  regions: string[]
  contact_info: string | null
  valid_until: string
  created_at: string
  company_name: string
}

type Props = {
  role: 'researcher' | 'supplier'
  requests: BoardRequest[]
  ads: BoardAd[]
  myAdIds?: Set<string>
}

function daysLeft(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function DeadlineBadge({ dateStr, t, locale }: { dateStr: string; t: (k: string) => string; locale: string }) {
  const days = daysLeft(dateStr)
  if (days < 0) return <Badge variant="outline" className="text-xs text-muted-foreground">{t('bd.deadlineClosed')}</Badge>
  if (days === 0) return <Badge className="text-xs bg-destructive">{t('bd.deadlineToday')}</Badge>
  if (days <= 2) return <Badge className="text-xs bg-orange-500">{t('bd.daysLeft').replace('{n}', String(days))}</Badge>
  if (days <= 7) return <Badge variant="secondary" className="text-xs">{t('bd.daysLeft').replace('{n}', String(days))}</Badge>
  return <Badge variant="outline" className="text-xs">{new Date(dateStr).toLocaleDateString(locale)}</Badge>
}

export function DualBoard({ role, requests, ads, myAdIds = new Set() }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'en' ? 'en-US' : 'ko-KR'
  const [filter, setFilter] = useState<SearchFilter>({ text: '', category: null })

  const requestHref = role === 'supplier' ? '/supplier/marketplace' : '/researcher/requests'
  const bidHref = (id: string) => role === 'supplier' ? `/supplier/bid/${id}` : `/researcher/requests/${id}`

  const filteredRequests = useMemo(() => {
    if (!filter.text && !filter.category) return requests

    return requests.filter(req => {
      const title = (req.title ?? '').toLowerCase()
      if (filter.category) {
        const catLabel = filter.category.label.toLowerCase()
        const catBreadcrumb = filter.category.breadcrumb.toLowerCase()
        const matchesCat = title.includes(catLabel) || title.includes(catBreadcrumb)
        if (!matchesCat) return false
      }
      if (filter.text) {
        return title.includes(filter.text.toLowerCase())
      }
      return true
    })
  }, [requests, filter])

  const isFiltered = filter.text.length > 0 || filter.category !== null

  return (
    <div className="space-y-4">
      {/* 검색 바 — 연구자 뷰에서만 표시 */}
      {role === 'researcher' && (
        <CategorySearch
          onFilterChange={setFilter}
          placeholder={t('bd.searchPh')}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 요청 게시판 ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">{t('bd.requests')}</h2>
              <Badge variant="secondary" className="text-xs">
                {isFiltered ? `${filteredRequests.length} / ${requests.length}` : requests.length}
              </Badge>
            </div>
            <Link href={requestHref} className="text-xs text-primary hover:underline">
              {t('bd.viewAll')}
            </Link>
          </div>

          {role === 'researcher' && (
            <Link
              href="/researcher/request"
              className={cn(buttonVariants({ size: 'sm' }), 'mb-3 w-full justify-center')}
            >
              {t('bd.newRequest')}
            </Link>
          )}

          <div className="flex flex-col gap-2">
            {filteredRequests.length === 0 && (
              <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {isFiltered ? t('bd.noSearchResult') : t('bd.noOpenRequests')}
              </div>
            )}
            {filteredRequests.map(req => {
              const expired = req.deadline ? daysLeft(req.deadline) < 0 : false
              return (
                <Link
                  key={req.id}
                  href={bidHref(req.id)}
                  className={cn(
                    'block rounded-lg border p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors',
                    expired ? 'opacity-60' : 'border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-medium text-sm truncate">{req.title ?? t('dash.noTitle')}</span>
                        {req.type === 'batch' && (
                          <Badge variant="outline" className="text-[10px] py-0">{t('bd.batchN').replace('{n}', String(req.item_count))}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {req.delivery_city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />{req.delivery_city}
                          </span>
                        )}
                        {req.is_group_buy && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary/15 px-1.5 py-0.5 text-[10px] font-medium text-secondary">
                            <ShoppingCart className="h-2.5 w-2.5" /> 그룹바이
                          </span>
                        )}
                        {req.discount_requested && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            <Tag className="h-2.5 w-2.5" /> 할인요청
                          </span>
                        )}
                        <span>{t('bd.bidsN').replace('{n}', String(req.bid_count))}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {req.deadline ? <DeadlineBadge dateStr={req.deadline} t={t} locale={locale} /> : (
                        <Badge variant="outline" className="text-xs">{t('bd.noDeadline')}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── 공급자 광고 게시판 ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold">{t('bd.ads')}</h2>
              <Badge variant="secondary" className="text-xs">{ads.length}</Badge>
            </div>
            {role === 'supplier' && (
              <Link href="/supplier/ads/new" className="text-xs text-amber-600 hover:underline">
                {t('bd.newAd')}
              </Link>
            )}
          </div>

          {role === 'supplier' && (
            <Link
              href="/supplier/ads/new"
              className={cn(
                buttonVariants({ size: 'sm', variant: 'outline' }),
                'mb-3 w-full justify-center border-amber-200 text-amber-700 hover:bg-amber-50'
              )}
            >
              {t('bd.newAdCta')}
            </Link>
          )}

          <div className="flex flex-col gap-2">
            {!ads.length && (
              <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {role === 'supplier' ? t('bd.adEmptySupplier') : t('bd.adEmptyResearcher')}
              </div>
            )}
            {ads.map(ad => {
              const isMine = myAdIds.has(ad.id)
              const days = daysLeft(ad.valid_until)
              return (
                <div
                  key={ad.id}
                  className={cn(
                    'rounded-lg border p-3',
                    isMine ? 'border-amber-300 bg-amber-50' : 'border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {isMine && <Badge className="text-[10px] bg-amber-500 py-0">{t('bd.myAd')}</Badge>}
                        <span className="font-medium text-sm">{ad.company_name}</span>
                      </div>
                      <p className="text-sm font-medium mb-1">{ad.title}</p>
                      {ad.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{ad.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {ad.categories.slice(0, 3).map(c => (
                          <Badge key={c} variant="outline" className="text-[10px] py-0">{c}</Badge>
                        ))}
                        {ad.regions.length > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />{ad.regions.slice(0, 2).join('·')}
                          </span>
                        )}
                      </div>
                      {ad.contact_info && (
                        <p className="text-xs text-primary mt-1.5">📞 {ad.contact_info}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {days <= 0 ? t('bd.expired') : days <= 3 ? <span className="text-orange-500 font-medium">{t('bd.daysLeft').replace('{n}', String(days))}</span> : t('bd.daysSuffix').replace('{n}', String(days))}
                      </div>
                      {isMine && (
                        <form action={`/supplier/ads/${ad.id}/delete`} method="POST" className="mt-1">
                          <button type="submit" className="text-[10px] text-muted-foreground hover:text-destructive underline">
                            {t('bd.delete')}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
