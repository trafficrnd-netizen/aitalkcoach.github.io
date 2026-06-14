import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Store, Users, TrendingDown } from 'lucide-react'
import { MarketplaceList } from '@/components/marketplace-list'
import { RemainingCreditsBar } from '@/components/remaining-credits-bar'
import { getActiveGroupBuys } from '@/lib/actions/group-buy'
import { getServerT } from '@/lib/i18n/server'

export default async function MarketplacePage() {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('supplier_profiles')
    .select('categories')
    .eq('user_id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requests } = await (supabase as any)
    .from('requests')
    .select('id, title, type, deadline, delivery_address, delivery_city, is_group_buy, discount_requested, created_at, notes, item_type, user_id')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(60)

  const requestIds: string[] = (requests ?? []).map((r: { id: string }) => r.id)

  // 품목 수 + 입찰 수 + 내 입찰을 병렬 조회
  // 단골 연구자 ID 조회 (supplier_followers)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: followRows } = await (supabase as any)
    .from('supplier_followers')
    .select('researcher_id')
    .eq('supplier_id', user.id)
  const preferredResearcherIds = new Set<string>((followRows ?? []).map((r: { researcher_id: string }) => r.researcher_id))

  const [{ data: itemCounts }, { data: bidCounts }, { data: myBids }] = await Promise.all([
    requestIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any).from('request_items').select('request_id').in('request_id', requestIds)
      : Promise.resolve({ data: [] }),
    requestIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any).from('bids').select('request_id').in('request_id', requestIds)
      : Promise.resolve({ data: [] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('bids').select('request_id').eq('supplier_id', user.id),
  ])

  const itemCountMap: Record<string, number> = {}
  for (const row of (itemCounts ?? [])) {
    itemCountMap[row.request_id] = (itemCountMap[row.request_id] ?? 0) + 1
  }
  const bidCountMap: Record<string, number> = {}
  for (const row of (bidCounts ?? [])) {
    bidCountMap[row.request_id] = (bidCountMap[row.request_id] ?? 0) + 1
  }
  const myBidList: string[] = (myBids ?? []).map((b: { request_id: string }) => b.request_id)

  const hasCategories = (profile?.categories?.length ?? 0) > 0

  // 그룹 바이 클러스터 — 묶음 견적 기회
  const groupBuys = await getActiveGroupBuys(7, 2)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('dash.marketplaceTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('dash.marketplaceSub')}</p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{t('dash.openRequestsCount').replace('{n}', String(requests?.length ?? 0))}</span>
      </div>

      {!hasCategories && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-900">
          <p className="font-medium mb-1">{t('mp.catNoneTitle')}</p>
          <p className="text-amber-700 mb-2">{t('mp.catNoneDesc')}</p>
          <Link href="/supplier/settings" className="underline font-medium">{t('mp.catNoneCta')}</Link>
        </div>
      )}

      {/* 그룹 바이 — 묶음 견적 기회 */}
      {groupBuys.length > 0 && (
        <section className="mb-6 rounded-xl border-2 border-secondary/30 bg-secondary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-5 w-5 text-secondary" />
            <h2 className="font-bold text-foreground">{t('mp.gbTitle')}</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">{t('mp.gbClusters').replace('{n}', String(groupBuys.length))}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-snug">
            {t('mp.gbDesc')}
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {groupBuys.slice(0, 6).map((g) => (
              <div key={g.matchKey} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">{g.substanceName}</span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 shrink-0">
                    <Users className="h-3 w-3" />{t('mp.peopleCount').replace('{n}', String(g.researcherCount))}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {g.casNumber && <span className="font-mono">{g.casNumber} · </span>}
                  합산 <strong className="text-foreground">{g.totalQty.toLocaleString()}{g.unit ? ` ${g.unit}` : ''}</strong>
                  {' · '}요청 {g.requestCount}건
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <MarketplaceList
        requests={requests ?? []}
        itemCountMap={itemCountMap}
        bidCountMap={bidCountMap}
        myBidSet={myBidList}
        preferredResearcherIds={preferredResearcherIds}
      />

      {/* 잔여 크레딧 · 무료 한도 */}
      <RemainingCreditsBar />
    </div>
  )
}
