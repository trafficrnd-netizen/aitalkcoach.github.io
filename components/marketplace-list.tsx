'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { ITEM_TYPE_LABELS, ITEM_TYPE_ICONS, type ItemType } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { Star, ShoppingCart, Tag } from 'lucide-react'

type Request = {
  id: string
  title: string | null
  type: string
  deadline: string | null
  delivery_address: string | null
  created_at: string
  notes: string | null
  item_type: string | null
  user_id?: string | null
  delivery_city?: string | null
  is_group_buy?: boolean | null
  discount_requested?: boolean | null
}

const FILTER_TABS: { value: 'all' | ItemType; label: string; icon: string }[] = [
  { value: 'all', label: '전체', icon: '📋' },
  { value: 'reagent', label: ITEM_TYPE_LABELS.reagent, icon: ITEM_TYPE_ICONS.reagent },
  { value: 'protein', label: ITEM_TYPE_LABELS.protein, icon: ITEM_TYPE_ICONS.protein },
  { value: 'supply', label: ITEM_TYPE_LABELS.supply, icon: ITEM_TYPE_ICONS.supply },
  { value: 'equipment', label: ITEM_TYPE_LABELS.equipment, icon: ITEM_TYPE_ICONS.equipment },
]

interface Props {
  requests: Request[]
  itemCountMap: Record<string, number>
  bidCountMap: Record<string, number>
  myBidSet: string[]
  preferredResearcherIds?: Set<string>
}

export function MarketplaceList({ requests, itemCountMap, bidCountMap, myBidSet, preferredResearcherIds }: Props) {
  const [activeType, setActiveType] = useState<'all' | ItemType>('all')
  const myBids = new Set(myBidSet)
  const today = new Date()

  const filtered = activeType === 'all'
    ? requests
    : requests.filter(r => (r.item_type ?? 'reagent') === activeType)

  // 단골 연구자 요청을 상단으로 정렬
  const sorted = preferredResearcherIds && preferredResearcherIds.size > 0
    ? [...filtered].sort((a, b) => {
        const aPreferred = a.user_id && preferredResearcherIds.has(a.user_id) ? 1 : 0
        const bPreferred = b.user_id && preferredResearcherIds.has(b.user_id) ? 1 : 0
        return bPreferred - aPreferred
      })
    : filtered

  const preferredCount = preferredResearcherIds
    ? sorted.filter(r => r.user_id && preferredResearcherIds.has(r.user_id)).length
    : 0

  return (
    <>
      {/* 유형 필터 탭 */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveType(tab.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
              activeType === tab.value
                ? 'border-primary bg-primary text-primary-foreground font-medium'
                : 'border-border bg-background text-foreground hover:border-primary'
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.value !== 'all' && (
              <span className={cn(
                'ml-0.5 rounded-full px-1.5 py-0 text-[10px]',
                activeType === tab.value ? 'bg-primary-foreground/20' : 'bg-muted'
              )}>
                {requests.filter(r => (r.item_type ?? 'reagent') === tab.value).length}
              </span>
            )}
          </button>
        ))}
        {activeType !== 'all' && (
          <span className="text-xs text-muted-foreground self-center ml-1">
            {filtered.length}건 표시 / 전체 {requests.length}건
          </span>
        )}
      </div>

      {/* 단골 연구자 존재 시 안내 배지 */}
      {preferredCount > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-secondary font-medium">
          <Star className="h-3.5 w-3.5 fill-secondary" />
          단골 연구자 요청 {preferredCount}건 상단 표시
        </div>
      )}

      {/* 요청 목록 */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground text-sm">
          {activeType === 'all' ? '현재 공개된 견적 요청이 없습니다.' : `${ITEM_TYPE_LABELS[activeType as ItemType]} 요청이 없습니다.`}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(req => {
            const alreadyBid = myBids.has(req.id)
            const itemCount = itemCountMap[req.id] ?? 0
            const bidCount = bidCountMap[req.id] ?? 0
            const isExpired = req.deadline && new Date(req.deadline) < today
            const itemType = (req.item_type ?? 'reagent') as ItemType
            const isPreferred = req.user_id && preferredResearcherIds?.has(req.user_id)

            return (
              <div
                key={req.id}
                className={cn(
                  'rounded-lg border p-4',
                  isPreferred ? 'border-secondary/40 bg-secondary/5' : alreadyBid ? 'border-primary/30 bg-primary/5' : 'border-border bg-background'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm">{ITEM_TYPE_ICONS[itemType]}</span>
                      <span className="font-semibold">{req.title ?? '(제목 없음)'}</span>
                      <Badge variant="outline" className="text-xs">
                        {req.type === 'batch' ? `묶음 ${itemCount}개 품목` : '단건'}
                      </Badge>
                      {isPreferred && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-medium text-secondary">
                          <Star className="h-2.5 w-2.5 fill-secondary" /> 단골
                        </span>
                      )}
                      {alreadyBid && <Badge variant="secondary" className="text-xs">입찰 완료</Badge>}
                      {isExpired && <Badge variant="outline" className="text-xs text-muted-foreground">마감됨</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {req.deadline && (
                        <span className={isExpired ? 'text-destructive font-medium' : ''}>
                          마감 {new Date(req.deadline).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                      {req.delivery_city && <span className="flex items-center gap-0.5">📍 {req.delivery_city}</span>}
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
                      <span>입찰 {bidCount}건</span>
                      <span className="text-muted-foreground/60">
                        {new Date(req.created_at).toLocaleDateString('ko-KR')} 게시
                      </span>
                    </div>
                    {req.notes && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-1">요청사항: {req.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {alreadyBid ? (
                      <span className="text-xs text-muted-foreground">완료</span>
                    ) : isExpired ? (
                      <span className="text-xs text-muted-foreground">마감</span>
                    ) : (
                      <Link href={`/supplier/bid/${req.id}`} className={buttonVariants({ size: 'sm' })}>
                        입찰하기
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
