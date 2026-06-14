import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DualBoard, type BoardRequest, type BoardAd } from '@/components/dual-board'
import { getServerT } from '@/lib/i18n/server'

export default async function SupplierBoardPage() {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Open requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requestRows } = await (supabase as any)
    .from('requests')
    .select('id, title, type, deadline, delivery_address, delivery_city, is_group_buy, discount_requested, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(30)

  const requestIds: string[] = (requestRows ?? []).map((r: { id: string }) => r.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: itemRows } = requestIds.length ? await (supabase as any)
    .from('request_items').select('request_id').in('request_id', requestIds) : { data: [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bidRows } = requestIds.length ? await (supabase as any)
    .from('bids').select('request_id').in('request_id', requestIds) : { data: [] }

  const itemMap: Record<string, number> = {}
  for (const r of (itemRows ?? [])) itemMap[r.request_id] = (itemMap[r.request_id] ?? 0) + 1
  const bidMap: Record<string, number> = {}
  for (const r of (bidRows ?? [])) bidMap[r.request_id] = (bidMap[r.request_id] ?? 0) + 1

  const requests: BoardRequest[] = (requestRows ?? []).map((r: {
    id: string; title: string | null; type: string
    deadline: string | null; delivery_address: string | null; delivery_city: string | null
    is_group_buy: boolean | null; discount_requested: boolean | null; created_at: string
  }) => ({
    ...r,
    item_count: itemMap[r.id] ?? 0,
    bid_count: bidMap[r.id] ?? 0,
  }))

  // Active supplier ads
  const today = new Date().toISOString().split('T')[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adRows } = await (supabase as any)
    .from('supplier_ads')
    .select('id, supplier_id, title, description, categories, regions, contact_info, valid_until, created_at')
    .gte('valid_until', today)
    .order('created_at', { ascending: false })
    .limit(30)

  const supplierIds: string[] = Array.from(new Set<string>((adRows ?? []).map((a: { supplier_id: string }) => a.supplier_id)))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRows } = supplierIds.length ? await (supabase as any)
    .from('supplier_profiles').select('user_id, company_name').in('user_id', supplierIds) : { data: [] }

  const profileMap: Record<string, string> = {}
  for (const p of (profileRows ?? [])) profileMap[p.user_id] = p.company_name

  const ads: BoardAd[] = (adRows ?? []).map((a: {
    id: string; supplier_id: string; title: string; description: string | null
    categories: string[]; regions: string[]; contact_info: string | null; valid_until: string; created_at: string
  }) => ({
    ...a,
    company_name: profileMap[a.supplier_id] ?? t('(공급자)'),
  }))

  // My ad IDs
  const myAdIds = new Set<string>(
    (adRows ?? [])
      .filter((a: { supplier_id: string }) => a.supplier_id === user.id)
      .map((a: { id: string }) => a.id)
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('bd.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('bd.subtitle')}</p>
      </div>
      <DualBoard role="supplier" requests={requests} ads={ads} myAdIds={myAdIds} />
    </div>
  )
}
