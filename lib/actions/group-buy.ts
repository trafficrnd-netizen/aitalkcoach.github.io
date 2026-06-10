'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface GroupBuyCluster {
  matchKey: string
  casNumber: string | null
  substanceName: string
  researcherCount: number
  requestCount: number
  totalQty: number
  unit: string | null
  requestIds: string[]
}

/** 현재 진행 중인 그룹 바이 클러스터 (활성 요청, 최근 7일, 연구자 2명 이상) */
export async function getActiveGroupBuys(days = 7, minResearchers = 2): Promise<GroupBuyCluster[]> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).rpc('current_group_buys', { p_days: days, p_min_researchers: minResearchers })
  return (data ?? []).map((r: {
    match_key: string; cas_number: string | null; substance_name: string;
    researcher_count: number; request_count: number; total_qty: number;
    unit: string | null; request_ids: string[]
  }) => ({
    matchKey: r.match_key,
    casNumber: r.cas_number,
    substanceName: r.substance_name,
    researcherCount: r.researcher_count,
    requestCount: r.request_count,
    totalQty: Number(r.total_qty ?? 0),
    unit: r.unit,
    requestIds: r.request_ids ?? [],
  }))
}

/** 특정 요청에 대해 함께 묶일 수 있는 동료 수 (요청 상세에 표시) */
export async function getGroupBuyPeers(requestId: string): Promise<{ researcherCount: number; requestCount: number; totalQty: number; unit: string | null }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc('group_buy_peers_for', { p_request_id: requestId })
  const d = data as { researcher_count?: number; request_count?: number; total_qty?: number; unit?: string | null } | null
  return {
    researcherCount: Number(d?.researcher_count ?? 0),
    requestCount: Number(d?.request_count ?? 0),
    totalQty: Number(d?.total_qty ?? 0),
    unit: d?.unit ?? null,
  }
}
