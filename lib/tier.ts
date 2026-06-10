/** 공급자 티어 정의 — 공급자 추천 카운트 기반 */
export type SupplierTier = 'bronze' | 'silver' | 'gold' | null

export const TIER_META: Record<Exclude<SupplierTier, null>, {
  label: string
  min: number
  next: number | null
  color: string
  perks: string[]
}> = {
  bronze: { label: 'Bronze', min: 10,  next: 30,   color: '#CD7F32', perks: ['전용 코드 발급', '연구자 팔로우 가능'] },
  silver: { label: 'Silver', min: 30,  next: 100,  color: '#A8A8A8', perks: ['마켓플레이스 상위 노출', 'Silver 배지'] },
  gold:   { label: 'Gold',   min: 100, next: null, color: '#D4AF37', perks: ['Trusted Partner 배지', '메인 노출', '우선 알림'] },
}

export function tierFromCount(count: number): SupplierTier {
  if (count >= 100) return 'gold'
  if (count >= 30)  return 'silver'
  if (count >= 10)  return 'bronze'
  return null
}

export function nextTierInfo(count: number): { next: SupplierTier; needed: number | null } {
  if (count < 10)  return { next: 'bronze', needed: 10 - count }
  if (count < 30)  return { next: 'silver', needed: 30 - count }
  if (count < 100) return { next: 'gold',   needed: 100 - count }
  return { next: null, needed: null }
}
