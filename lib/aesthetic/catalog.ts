/**
 * 에스테틱 버티컬 카탈로그 (전문의약품 제외).
 * 연구 카탈로그(lib/categories.ts)와 동일한 구조(CategoryNode)를 사용해
 * 요청 폼·검색·자동완성 컴포넌트를 그대로 재사용할 수 있게 한다.
 *
 * 취급 범위: 미용기기 소모품 · 일회용 시술 부자재 · 관리실 화장품.
 */

import type { CategoryNode } from '@/lib/categories'

export type AestheticType = 'device' | 'supply' | 'cosmetic'

export const AESTHETIC_TYPE_LABELS: Record<AestheticType, string> = {
  device: '미용기기 소모품',
  supply: '시술 부자재',
  cosmetic: '관리실 화장품',
}

export const AESTHETIC_TYPE_ICONS: Record<AestheticType, string> = {
  device: '💠',
  supply: '🧷',
  cosmetic: '🧴',
}

/** 의료기기 판매 자격(med_device 인증)이 필요한 유형 — 화장품은 불필요 */
export function requiresMedDevice(type: AestheticType): boolean {
  return type === 'device' || type === 'supply'
}

export const AESTHETIC_TREE: Record<AestheticType, CategoryNode[]> = {
  device: [
    { code: 'device.cartridge', label: '카트리지 (HIFU·RF 등)' },
    { code: 'device.tip', label: '팁·핸드피스 소모품' },
    { code: 'device.gel', label: '시술용 젤·쿨링젤' },
    { code: 'device.pad', label: '패드·전극·소모 부품' },
  ],
  supply: [
    { code: 'supply.needle', label: '니들·마이크로니들' },
    { code: 'supply.thread', label: '실(thread)·삽입 부자재' },
    { code: 'supply.syringe', label: '시린지·캐뉼라' },
    { code: 'supply.dressing', label: '드레싱·소독·거즈' },
    { code: 'supply.disposable', label: '일회용 위생용품(글러브·가운 등)' },
  ],
  cosmetic: [
    { code: 'cosmetic.skincare', label: '관리실 스킨케어' },
    { code: 'cosmetic.mask', label: '마스크·모델링팩' },
    { code: 'cosmetic.ampoule', label: '앰플·세럼' },
    { code: 'cosmetic.bodySpa', label: '바디·스파 용품' },
  ],
}

export const AESTHETIC_TYPES: AestheticType[] = ['device', 'supply', 'cosmetic']

/** 단위 옵션 (요청 폼 재사용) */
export const AESTHETIC_UNITS = ['ea', 'box', 'set', 'pack', 'mL', 'g'] as const

/** 코드 → 라벨 빠른 조회 */
const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  AESTHETIC_TYPES.flatMap(t => AESTHETIC_TREE[t].map(n => [n.code, n.label] as const)),
)

export function aestheticLabel(code: string): string {
  return LABEL_BY_CODE[code] ?? code
}
