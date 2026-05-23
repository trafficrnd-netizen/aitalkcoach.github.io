/**
 * 크레딧 시스템 헬퍼
 * - awardCredits / spendCredits: Supabase RPC 래퍼 (트랜잭션 안전)
 * - getEffectiveQuota: quota_settings의 동적 공식으로 주간 무료 견적 한도 계산
 * - getThisWeekUsage: 이번 주 무료 한도 사용량 (credit_ledger reason 기반)
 */
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type Role = 'researcher' | 'supplier'

export interface DynamicFormula {
  base: number
  per_researcher: number
  max: number
  min: number
  early_bird_bonus?: number
}

export interface QuotaSetting {
  role: Role
  period: string
  early_bird_quota: number
  normal_quota: number
  dynamic_enabled: boolean
  dynamic_formula: DynamicFormula | null
}

/** 적립행위 트리거 — 실패해도 본업무는 계속 진행되도록 try/catch로 감쌀 것 */
export async function awardCredits(
  userId: string,
  ruleKey: string,
  role: Role,
  refTable?: string,
  refId?: string
): Promise<number> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc('award_credits', {
    p_user_id: userId,
    p_rule_key: ruleKey,
    p_role: role,
    p_ref_table: refTable ?? null,
    p_ref_id: refId ?? null,
  })
  if (error) {
    console.error('[awardCredits] RPC error:', error.message, { userId, ruleKey })
    return 0
  }
  return (data as number) ?? 0
}

/** 크레딧 차감. 잔액 부족 시 false 반환 */
export async function spendCredits(
  userId: string,
  amount: number,
  role: Role,
  reason: string
): Promise<boolean> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc('spend_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_role: role,
    p_reason: reason,
  })
  if (error) {
    console.error('[spendCredits] RPC error:', error.message, { userId, amount })
    return false
  }
  return !!data
}

/** quota_settings 조회 + 동적 공식 적용 */
export async function getEffectiveQuota(
  role: Role,
  isEarlyBird: boolean
): Promise<number> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: setting } = await (admin as any)
    .from('quota_settings')
    .select('*')
    .eq('role', role)
    .single()

  if (!setting) return isEarlyBird ? 2 : 1

  // 동적 공식 비활성 → 정적 값 반환
  if (!setting.dynamic_enabled || !setting.dynamic_formula) {
    return isEarlyBird ? setting.early_bird_quota : setting.normal_quota
  }

  // 동적 공식: base + per_researcher × researcherCount, min/max 클램프
  const formula = setting.dynamic_formula as DynamicFormula

  // 공급자만 동적: 활성 연구자 수 기반
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (admin as any)
    .from('researcher_profiles')
    .select('*', { count: 'exact', head: true })

  const researcherCount = count ?? 0
  let computed = formula.base + formula.per_researcher * researcherCount
  if (isEarlyBird && formula.early_bird_bonus) {
    computed += formula.early_bird_bonus
  }
  computed = Math.max(formula.min, Math.min(formula.max, computed))
  return Math.floor(computed)
}

/** 이번 주(7일) 동안 무료 사용량 카운트 (reason='quote_request_free' 등) */
export async function getThisWeekFreeUsage(
  userId: string,
  reasonPattern: string = 'quote_request_free'
): Promise<number> {
  const admin = createAdminClient()
  const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (admin as any)
    .from('credit_ledger')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('reason', reasonPattern)
    .gte('created_at', weekAgo)
  return count ?? 0
}

/**
 * 견적 요청·발송 시 한도 체크 및 차감 처리.
 * - 무료 한도 남아있으면 free 카운터에 -0 기록 (사용 흔적)
 * - 한도 초과 시 1크레딧 차감 시도, 부족하면 false 반환
 */
export async function consumeQuotaOrCredit(
  userId: string,
  role: Role,
  isEarlyBird: boolean,
  action: 'quote_request' | 'quote_send'
): Promise<{ ok: true; used: 'free' | 'credit' } | { ok: false; reason: string }> {
  const freeQuota = await getEffectiveQuota(role, isEarlyBird)
  const reasonFree = `${action}_free`
  const usage = await getThisWeekFreeUsage(userId, reasonFree)

  if (usage < freeQuota) {
    // 무료 한도 내 — 사용 흔적 기록 (delta=0, balance_after=현재 잔액 동일)
    const admin = createAdminClient()
    // 잔액 조회만 하면 됨 (RPC 안 거치고 직접 기록)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin as any)
      .from(role === 'researcher' ? 'researcher_profiles' : 'supplier_profiles')
      .select('credits')
      .eq('user_id', userId)
      .single()
    const balance = profile?.credits ?? 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('credit_ledger').insert({
      user_id: userId,
      delta: 0,
      balance_after: balance,
      reason: reasonFree,
    })
    return { ok: true, used: 'free' }
  }

  // 무료 한도 소진 → 크레딧 차감 시도
  const reasonCredit = `${action}_credit`
  const success = await spendCredits(userId, 1, role, reasonCredit)
  if (success) return { ok: true, used: 'credit' }

  return {
    ok: false,
    reason: `이번 주 무료 한도(${freeQuota}회)를 모두 사용했고, 사용 가능한 크레딧도 없습니다.`,
  }
}
