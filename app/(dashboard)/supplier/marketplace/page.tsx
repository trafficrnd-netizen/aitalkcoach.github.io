import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Store } from 'lucide-react'
import { MarketplaceList } from '@/components/marketplace-list'
import { RemainingCreditsBar } from '@/components/remaining-credits-bar'

export default async function MarketplacePage() {
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
    .select('id, title, type, deadline, delivery_address, created_at, notes, item_type')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(60)

  const requestIds: string[] = (requests ?? []).map((r: { id: string }) => r.id)

  // 품목 수 + 입찰 수 + 내 입찰을 병렬 조회
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">입찰 광장</h1>
            <p className="text-sm text-muted-foreground">연구자의 견적 요청에 경쟁 입찰하세요</p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">공개 요청 {requests?.length ?? 0}건</span>
      </div>

      {!hasCategories && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-900">
          <p className="font-medium mb-1">취급 카테고리가 설정되지 않았습니다</p>
          <p className="text-amber-700 mb-2">카테고리를 등록하면 관련 요청을 쉽게 파악할 수 있습니다.</p>
          <Link href="/supplier/settings" className="underline font-medium">설정하러 가기 →</Link>
        </div>
      )}

      <MarketplaceList
        requests={requests ?? []}
        itemCountMap={itemCountMap}
        bidCountMap={bidCountMap}
        myBidSet={myBidList}
      />

      {/* 잔여 크레딧 · 무료 한도 */}
      <RemainingCreditsBar />
    </div>
  )
}
