/**
 * 버티컬 레지스트리 — 공유 엔진 위에 도메인(연구/에스테틱)을 주입하는 단일 설정 지점.
 * 신규 버티컬은 여기 한 곳만 추가하면 라우팅·인증·브랜드·무료정책이 일관되게 적용된다.
 */

export type Vertical = 'research' | 'aesthetic'

export interface VerticalConfig {
  /** 버티컬 식별자 */
  id: Vertical
  /** 대고객 브랜드명 */
  brand: string
  /** 라우트 프리픽스 (research는 기존 경로 유지를 위해 '') */
  routePrefix: '' | '/medi'
  /** 공급사 인증 유형 (가입/배지/입찰필터에 사용) */
  certTypes: CertType[]
  /** 전액 무료 여부 — true면 크레딧/구독/수수료 게이팅을 우회한다 */
  free: boolean
}

export type CertType = 'business' | 'chem_control' | 'med_device'

export const VERTICALS: Record<Vertical, VerticalConfig> = {
  research: {
    id: 'research',
    brand: 'BidVibe',
    routePrefix: '',
    certTypes: ['business', 'chem_control'],
    free: false,
  },
  aesthetic: {
    id: 'aesthetic',
    brand: 'BidVibe Medi',
    routePrefix: '/medi',
    certTypes: ['business', 'med_device'],
    // 전액 무료: 거래·가입 극대화를 위해 의원·공급사 모두 무료
    free: true,
  },
}

export const DEFAULT_VERTICAL: Vertical = 'research'

export function getVertical(v: Vertical): VerticalConfig {
  return VERTICALS[v] ?? VERTICALS[DEFAULT_VERTICAL]
}

/** 전액 무료 버티컬 여부 — 크레딧/토큰/구독 체크 우회 가드에 사용 */
export function isFree(v: Vertical): boolean {
  return getVertical(v).free
}

/** 경로로 버티컬 식별 ('/medi/...' → aesthetic, 그 외 → research) */
export function verticalFromPath(pathname: string): Vertical {
  return pathname.startsWith('/medi') ? 'aesthetic' : 'research'
}

/** 버티컬 경로 빌더 (예: routePath('aesthetic','/request') => '/medi/request') */
export function routePath(v: Vertical, path: string): string {
  const prefix = getVertical(v).routePrefix
  const p = path.startsWith('/') ? path : `/${path}`
  return `${prefix}${p}`
}
