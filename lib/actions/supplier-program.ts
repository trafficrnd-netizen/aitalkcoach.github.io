'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tierFromCount, nextTierInfo, type SupplierTier } from '@/lib/tier'

const THRESHOLD = 10

export interface SupplierProgramStatus {
  count: number
  threshold: number
  code: string | null
  active: boolean
  earlybirdActive: boolean
  isFreePlan: boolean
  /** 코드가 실제로 작동하는지 (얼리버드 OR Pro+ 인 경우) */
  effective: boolean
  shareUrl: string | null
  followers: number
  requestsViaCode: number
  /** 티어 (카운트 기반 실시간) */
  tier: SupplierTier
  /** 다음 티어 + 남은 인원 */
  nextTier: SupplierTier
  nextTierIn: number | null
  /** 응답 통계 (빠른응답 인증용) */
  responseStats: { bids: number; avgMinutes: number; fastResponder: boolean } | null
  /** 공개 프로필 (/s/code) — 노출 조건 충족 시 */
  publicProfileUrl: string | null
  publicProfileEnabled: boolean
  /** 공개 노출 조건 충족 여부 (인증+티어) */
  publicEligible: boolean
}

/** 본인(공급자)의 추천 프로그램 현황 조회 */
export async function getSupplierProgramStatus(): Promise<SupplierProgramStatus | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // 카운트 (RPC) + 본인 프로필 + 얼리버드 + 팔로워/요청 수 + 응답통계
  const [
    { data: countRes },
    { data: profile },
    { data: setting },
    { count: followers },
    { count: reqViaCode },
    { data: respStats },
  ] = await Promise.all([
    db.rpc('count_verified_researcher_referrals', { p_supplier_id: user.id }),
    db.from('supplier_profiles').select('referral_code, referral_code_active, plan, referral_tier, verified_at, public_profile_enabled').eq('user_id', user.id).maybeSingle(),
    db.from('app_settings').select('value').eq('key', 'earlybird_active').maybeSingle(),
    db.from('supplier_followers').select('*', { count: 'exact', head: true }).eq('supplier_id', user.id),
    db.from('requests').select('*', { count: 'exact', head: true }).eq('preferred_supplier_id', user.id),
    db.rpc('supplier_response_stats', { p_supplier_id: user.id, p_days: 30 }),
  ])

  const count = typeof countRes === 'number' ? countRes : (countRes ?? 0)
  const code: string | null = profile?.referral_code ?? null
  const dbActive: boolean = profile?.referral_code_active ?? true
  const plan: string = profile?.plan ?? 'free'
  const isFreePlan = plan === 'free'
  const earlybirdActive = setting?.value === 'true'

  // 실효: 코드 발급됨 + DB 활성 + (얼리버드 또는 Pro+)
  const effective = !!code && dbActive && (earlybirdActive || !isFreePlan)
  const tier = tierFromCount(count)
  const { next: nextTier, needed: nextTierIn } = nextTierInfo(count)

  // 응답통계 정규화
  const rs = respStats as { bids?: number; avg_minutes?: number; fast_responder?: boolean } | null
  const responseStats = rs && rs.bids != null
    ? { bids: Number(rs.bids), avgMinutes: Number(rs.avg_minutes ?? 0), fastResponder: !!rs.fast_responder }
    : null

  // 공개 프로필 — 인증 + 티어 보유가 조건 (옵트인은 표시 토글)
  const verified = !!profile?.verified_at
  const publicProfileEnabled = profile?.public_profile_enabled ?? true
  const publicEligible = verified && !!tier
  const publicProfileUrl = publicEligible && publicProfileEnabled && code
    ? `https://ai-traffic.kr/s/${code}` : null

  return {
    count,
    threshold: THRESHOLD,
    code,
    active: dbActive,
    earlybirdActive,
    isFreePlan,
    effective,
    shareUrl: code ? `https://ai-traffic.kr/p/${code}` : null,
    followers: followers ?? 0,
    requestsViaCode: reqViaCode ?? 0,
    tier,
    nextTier,
    nextTierIn,
    responseStats,
    publicProfileUrl,
    publicProfileEnabled,
    publicEligible,
  }
}

/** 본인(공급자)이 임계치 도달 시 코드 발급 청구 */
export async function claimSupplierReferralCode(): Promise<
  { ok: true; code: string; alreadyIssued?: boolean } | { ok: false; reason: string; count?: number }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'unauthorized' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc('issue_supplier_referral_code', { p_supplier_id: user.id })
  if (error) return { ok: false, reason: error.message }
  if (!data?.ok) return { ok: false, reason: data?.reason ?? 'unknown', count: data?.count }
  return { ok: true, code: data.code, alreadyIssued: data.already_issued }
}

/** 연구자가 공급자 전용 코드로 팔로우 등록 */
export async function followSupplierByCode(code: string): Promise<{ ok: true; supplierId: string; companyName: string } | { ok: false; reason: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'unauthorized' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const normalized = code.trim().toUpperCase()
  const { data: supplier } = await db
    .from('supplier_profiles')
    .select('user_id, company_name, referral_code_active, plan')
    .eq('referral_code', normalized)
    .maybeSingle()
  if (!supplier) return { ok: false, reason: 'invalid_code' }

  // 얼리버드 상태 확인 (Pro+ 또는 얼리버드 ON인 경우만 활성 채널)
  const { data: setting } = await db.from('app_settings').select('value').eq('key', 'earlybird_active').maybeSingle()
  const earlybird = setting?.value === 'true'
  const effective = supplier.referral_code_active && (earlybird || supplier.plan !== 'free')
  if (!effective) return { ok: false, reason: 'code_inactive' }

  await db.from('supplier_followers').upsert({
    researcher_id: user.id,
    supplier_id: supplier.user_id,
    via_code: normalized,
  }, { onConflict: 'researcher_id,supplier_id' })

  return { ok: true, supplierId: supplier.user_id, companyName: supplier.company_name }
}

/** 공급자 코드로 정보 조회 (공개 — 로그인 불필요, 랜딩용) */
export async function lookupSupplierByCode(code: string): Promise<
  { ok: true; companyName: string; categories: string[]; verified: boolean; active: boolean } | { ok: false; reason: string }
> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const normalized = code.trim().toUpperCase()

  const [{ data: supplier }, { data: setting }] = await Promise.all([
    db.from('supplier_profiles').select('company_name, categories, verified_at, referral_code_active, plan').eq('referral_code', normalized).maybeSingle(),
    db.from('app_settings').select('value').eq('key', 'earlybird_active').maybeSingle(),
  ])
  if (!supplier) return { ok: false, reason: 'invalid_code' }

  const earlybird = setting?.value === 'true'
  const active = supplier.referral_code_active && (earlybird || supplier.plan !== 'free')

  return {
    ok: true,
    companyName: supplier.company_name,
    categories: supplier.categories ?? [],
    verified: !!supplier.verified_at,
    active,
  }
}
