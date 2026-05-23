/**
 * 무료 견적 한도 표시용 헬퍼 — 서버 전용
 * 견적 요청/입찰 페이지, 크레딧 페이지에서 공통 사용
 */
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEffectiveQuota, type Role } from '@/lib/credits'

export interface QuotaStatus {
  freeQuota: number
  used: number
  remaining: number
  isEarlyBird: boolean
  /** researcher: 견적요청 / supplier: 견적송신 */
  actionLabel: string
}

/** 사용자의 이번 주 무료 한도 현황 */
export async function getQuotaStatus(userId: string, role: Role): Promise<QuotaStatus> {
  const admin = createAdminClient()

  // 글로벌 얼리버드 기간 여부
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ebSetting } = await (admin as any)
    .from('app_settings')
    .select('value')
    .eq('key', 'earlybird_active')
    .maybeSingle()
  const isEarlyBird = ebSetting?.value === 'true'

  const freeQuota = await getEffectiveQuota(role, isEarlyBird)

  // 이번 주(7일) 사용량 — 실제 요청/입찰 건수 기준
  const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString()
  let used = 0
  if (role === 'researcher') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (admin as any)
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('researcher_id', userId)
      .gte('created_at', weekAgo)
    used = count ?? 0
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (admin as any)
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', userId)
      .gte('created_at', weekAgo)
    used = count ?? 0
  }

  return {
    freeQuota,
    used,
    remaining: Math.max(0, freeQuota - used),
    isEarlyBird,
    actionLabel: role === 'researcher' ? '견적요청' : '견적송신',
  }
}
