'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { FileText, Megaphone, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategorySearch, type SearchFilter } from '@/components/category-search'

export type BoardRequest = {
  id: string
  title: string | null
  type: string
  deadline: string | null
  delivery_address: string | null
  created_at: string
  item_count: number
  bid_count: number
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

function DeadlineBadge({ dateStr }: { dateStr: string }) {
  const days = daysLeft(dateStr)
  if (days < 0) return <Badge variant="outline" className="text-xs text-muted-foreground">마감됨</Badge>
  if (days === 0) return <Badge className="text-xs bg-destructive">오늘 마감</Badge>
  if (days <= 2) return <Badge className="text-xs bg-orange-500">{days}일 남음</Badge>
  if (days <= 7) return <Badge variant="secondary" className="text-xs">{days}일 남음</Badge>
  return <Badge variant="outline" className="text-xs">{new Date(dateStr).toLocaleDateString('ko-KR')}</Badge>
}

export function DualBoard({ role, requests, ads, myAdIds = new Set() }: Props) {
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
          placeholder="품목명·카테고리로 요청 검색..."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 요청 게시판 ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">요청 게시판</h2>
              <Badge variant="secondary" className="text-xs">
                {isFiltered ? `${filteredRequests.length} / ${requests.length}` : requests.length}
              </Badge>
            </div>
            <Link href={requestHref} className="text-xs text-primary hover:underline">
              전체 보기 →
            </Link>
          </div>

          {role === 'researcher' && (
            <Link
              href="/researcher/request"
              className={cn(buttonVariants({ size: 'sm' }), 'mb-3 w-full justify-center')}
            >
              + 새 견적 요청
            </Link>
          )}

          <div className="flex flex-col gap-2">
            {filteredRequests.length === 0 && (
              <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {isFiltered ? '검색 결과가 없습니다.' : '현재 공개된 요청이 없습니다.'}
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
                        <span className="font-medium text-sm truncate">{req.title ?? '(제목 없음)'}</span>
                        {req.type === 'batch' && (
                          <Badge variant="outline" className="text-[10px] py-0">묶음 {req.item_count}종</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {req.delivery_address && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />{req.delivery_address.slice(0, 10)}
                          </span>
                        )}
                        <span>입찰 {req.bid_count}건</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {req.deadline ? <DeadlineBadge dateStr={req.deadline} /> : (
                        <Badge variant="outline" className="text-xs">기한 없음</Badge>
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
              <h2 className="text-lg font-bold">공급자 광고판</h2>
              <Badge variant="secondary" className="text-xs">{ads.length}</Badge>
            </div>
            {role === 'supplier' && (
              <Link href="/supplier/ads/new" className="text-xs text-amber-600 hover:underline">
                + 광고 등록
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
              + 광고 등록하기
            </Link>
          )}

          <div className="flex flex-col gap-2">
            {!ads.length && (
              <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {role === 'supplier' ? '광고를 등록해 연구자에게 알리세요.' : '등록된 공급자 광고가 없습니다.'}
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
                        {isMine && <Badge className="text-[10px] bg-amber-500 py-0">내 광고</Badge>}
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
                        {days <= 0 ? '만료됨' : days <= 3 ? <span className="text-orange-500 font-medium">{days}일 남음</span> : `${days}일`}
                      </div>
                      {isMine && (
                        <form action={`/supplier/ads/${ad.id}/delete`} method="POST" className="mt-1">
                          <button type="submit" className="text-[10px] text-muted-foreground hover:text-destructive underline">
                            삭제
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
