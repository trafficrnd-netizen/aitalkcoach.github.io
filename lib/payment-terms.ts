/** 결제조건 옵션 — 연구자가 견적 요청 시 선택 (공급자 신뢰도 판단 자료) */
export const PAYMENT_TERMS = [
  { value: 'prepaid',     label: '선결제', desc: '발주 시 즉시 결제' },
  { value: 'on_delivery', label: '납품 시 결제', desc: '물품 수령 후 즉시' },
  { value: 'net_30',      label: '30일 후 결제', desc: '납품 후 30일 (월말 정산 등)' },
  { value: 'net_60',      label: '60일 후 결제', desc: '납품 후 60일' },
  { value: 'institution', label: '기관 정산', desc: '학교·연구기관 행정 절차 경유' },
] as const

export type PaymentTermValue = typeof PAYMENT_TERMS[number]['value']

export function paymentTermLabel(value: string | null | undefined): string {
  return PAYMENT_TERMS.find(t => t.value === value)?.label ?? '미지정'
}
