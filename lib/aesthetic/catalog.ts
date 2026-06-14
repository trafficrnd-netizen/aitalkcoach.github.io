/**
 * 에스테틱 버티컬 카탈로그 - 피부관리실/클리닉 소모품/부자재 (전문의약품 제외).
 * 7개 대분류: 위생/일회용 / 팩/마스크 / 클렌징/케어 / 시술도구 / 베드보호 / 타월/가운 / 기기소모품
 *
 * 의원(clinic)       : 필요한 품목을 요청 - 구매자 역할
 * 공급사(medi-supplier): 공급 가능 품목 입찰 - 판매자 역할
 */

import type { CategoryNode } from '@/lib/categories'

export type AestheticType =
  | 'hygiene'   // 위생/일회용
  | 'pack'      // 팩/마스크
  | 'care'      // 클렌징/케어
  | 'tool'      // 시술도구
  | 'bed'       // 베드/침대보호
  | 'textile'   // 타월/가운
  | 'device'    // 기기소모품

export const AESTHETIC_TYPE_LABELS: Record<AestheticType, string> = {
  hygiene: '위생/일회용',
  pack:    '팩/마스크',
  care:    '클렌징/케어',
  tool:    '시술도구',
  bed:     '베드/침대보호',
  textile: '타월/가운',
  device:  '기기소모품',
}

/** 의원 맥락: 요청 폼 카테고리 설명 */
export const AESTHETIC_TYPE_DESC_CLINIC: Record<AestheticType, string> = {
  hygiene: '해면/베개시트/거즈/장갑 등 매회 교체 소모품',
  pack:    '모델링팩/시트마스크 등 팩 재료',
  care:    '앰플/클렌징/토너 전문가용 대용량',
  tool:    '괄사/니들/롤러 등 시술 도구',
  bed:     '베드커버/일회용 시트/안면베개',
  textile: '타월/가운/수건',
  device:  '카트리지/팁/젤 등 기기 소모품',
}

/** 공급사 맥락: 마켓플레이스 필터 설명 */
export const AESTHETIC_TYPE_DESC_SUPPLIER: Record<AestheticType, string> = {
  hygiene: '일회용 위생용품 공급 (해면/거즈/베개시트 등)',
  pack:    '팩/마스크 원료 및 완제품 공급',
  care:    '스킨케어 앰플/클렌징 대용량 공급',
  tool:    '시술 도구 및 니들류 공급',
  bed:     '베드 커버/보호 용품 공급',
  textile: '타월/가운류 공급',
  device:  '미용기기 소모품 (카트리지/젤) 공급',
}

export const AESTHETIC_TYPE_ICONS: Record<AestheticType, string> = {
  hygiene: '🧤',
  pack:    '😦',
  care:    '🧴',
  tool:    '✂',
  bed:     '🛏',
  textile: '🧺',
  device:  '⚡',
}

/** 의료기기 판매 자격(med_device 인증)이 필요한 유형 */
export function requiresMedDevice(type: AestheticType): boolean {
  return type === 'device' || type === 'tool'
}

export const AESTHETIC_TREE: Record<AestheticType, CategoryNode[]> = {
  hygiene: [
    { code: 'hygiene.sponge',      label: '클렌징 해면 (일회용 부직포/라텍스)' },
    { code: 'hygiene.pillowsheet', label: '베개시트/부직포 커버 (U자형/일자)' },
    { code: 'hygiene.gauze',       label: '거즈/화장솜 (사각거즈/절단솜)' },
    { code: 'hygiene.underwear',   label: '일회용 속옷 (T-팬티/삼각)' },
    { code: 'hygiene.gown',        label: '일회용 가운/헤어터번/위생모' },
    { code: 'hygiene.glove',       label: '장갑 (니트릴/라텍스)' },
  ],
  pack: [
    { code: 'pack.modeling', label: '모델링팩/석고팩 (대용량 1kg)' },
    { code: 'pack.sheet',    label: '일회용 마스크시트 (부직포)' },
    { code: 'pack.medical',  label: '메디컬 마스크/진정/재생팩' },
    { code: 'pack.material', label: '팩 재료 (스파츌라/믹싱볼)' },
  ],
  care: [
    { code: 'care.ampoule', label: '앰플/세럼 (전문가용 대용량)' },
    { code: 'care.cleanse', label: '클렌징 밀크/폼/오일' },
    { code: 'care.toner',   label: '토너/로션 (전문가용)' },
    { code: 'care.peeling', label: '필링젤/AHA/스크럽' },
  ],
  tool: [
    { code: 'tool.guasha',  label: '괄사 (옥/물소뿔/나무)' },
    { code: 'tool.needle',  label: 'MTS/더마펜 니들 카트리지' },
    { code: 'tool.syringe', label: '주사기/캐뉼라 (메디컬 클리닉용)' },
    { code: 'tool.roller',  label: '지압봉/롤러/마사지 도구' },
  ],
  bed: [
    { code: 'bed.cover',  label: '베드커버/레자/엠보싱 커버' },
    { code: 'bed.sheet',  label: '일회용 베드시트 (롤형)' },
    { code: 'bed.pad',    label: '패드/타올커버' },
    { code: 'bed.pillow', label: '안면베개/가슴베개' },
  ],
  textile: [
    { code: 'textile.towel', label: '타월/수건 (순면/극세사 대형/소형)' },
    { code: 'textile.gown',  label: '가운/환자복 (재사용형)' },
  ],
  device: [
    { code: 'device.cartridge', label: '레이저/HIFU/RF 카트리지' },
    { code: 'device.tip',       label: '팁/핸드피스 소모품' },
    { code: 'device.gel',       label: '초음파젤/쿨링젤/전도젤' },
    { code: 'device.steamer',   label: '스티머 소모품/아로마/필터' },
    { code: 'device.disinfect', label: '소독용품/UV 소독기 소모품' },
  ],
}

export const AESTHETIC_TYPES: AestheticType[] = [
  'hygiene', 'pack', 'care', 'tool', 'bed', 'textile', 'device'
]

/** 단위 옵션 */
export const AESTHETIC_UNITS = ['ea', 'box', 'set', 'pack', 'roll', 'kg', 'mL', 'g'] as const

/** 코드 -> 라벨 빠른 조회 */
const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  AESTHETIC_TYPES.flatMap(t => AESTHETIC_TREE[t].map(n => [n.code, n.label] as const)),
)

export function aestheticLabel(code: string): string {
  return LABEL_BY_CODE[code] ?? code
}
