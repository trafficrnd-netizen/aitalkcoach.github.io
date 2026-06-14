import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DualBoard, type BoardRequest, type BoardAd } from '@/components/dual-board'
import { getServerT } from '@/lib/i18n/server'

export default async function ResearcherBoardPage() {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // 1차 배치: 견적 요청 + 공급자 광고를 병렬 조회
  const [{ data: requestRows }, { data: adRows }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('requests')
      .select('id, title, type, deadline, delivery_address, delivery_city, is_group_buy, discount_requested, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(30),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('supplier_ads')
      .select('id, supplier_id, title, description, categories, regions, contact_info, valid_until, created_at')
      .gte('valid_until', today)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const requestIds: string[] = (requestRows ?? []).map((r: { id: string }) => r.id)
  const supplierIds: string[] = Array.from(
    new Set<string>((adRows ?? []).map((a: { supplier_id: string }) => a.supplier_id))
  )

  // 2차 배치: 품목 수 + 입찰 수 + 공급자 프로필을 병렬 조회
  const [{ data: itemRows }, { data: bidRows }, { data: profileRows }] = await Promise.all([
    requestIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any).from('request_items').select('request_id').in('request_id', requestIds)
      : Promise.resolve({ data: [] }),
    requestIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any).from('bids').select('request_id').in('request_id', requestIds)
      : Promise.resolve({ data: [] }),
    supplierIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any).from('supplier_profiles').select('user_id, company_name').in('user_id', supplierIds)
      : Promise.resolve({ data: [] }),
  ])

  const itemMap: Record<string, number> = {}
  for (const r of (itemRows ?? [])) itemMap[r.request_id] = (itemMap[r.request_id] ?? 0) + 1
  const bidMap: Record<string, number> = {}
  for (const r of (bidRows ?? [])) bidMap[r.request_id] = (bidMap[r.request_id] ?? 0) + 1

  const requests: BoardRequest[] = (requestRows ?? []).map((r: {
    id: string; title: string | null; type: string
    deadline: string | null; delivery_address: string | null; created_at: string
  }) => ({
    ...r,
    item_count: itemMap[r.id] ?? 0,
    bid_count: bidMap[r.id] ?? 0,
  }))

  const profileMap: Record<string, string> = {}
  for (const p of (profileRows ?? [])) profileMap[p.user_id] = p.company_name

  const ads: BoardAd[] = (adRows ?? []).map((a: {
    id: string; supplier_id: string; title: string; description: string | null
    categories: string[]; regions: string[]; contact_info: string | null; valid_until: string; created_at: string
  }) => ({
    ...a,
    company_name: profileMap[a.supplier_id] ?? t('(공급자)'),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('bd.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('bd.subtitle')}</p>
      </div>
      <DualBoard role="researcher" requests={requests} ads={ads} />
    </div>
  )
}
