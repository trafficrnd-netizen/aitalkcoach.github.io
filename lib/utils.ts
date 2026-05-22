import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 한국 주소에서 시(市) 이름만 추출.
 * 낙찰 전 공급자에게는 시 이름만 노출, 낙찰 후 전체 주소 공개.
 *
 * 예시:
 *  "서울특별시 강남구 테헤란로 123"      → "서울특별시"
 *  "부산광역시 해운대구 센텀중앙로 48"   → "부산광역시"
 *  "세종특별자치시 한누리대로 2130"       → "세종특별자치시"
 *  "경기도 수원시 영통구 삼성로 129"      → "수원시"
 *  "제주특별자치도 제주시 첨단로 213"     → "제주시"
 *  "충청북도 청주시 상당구 상당로 82"     → "청주시"
 */
export function maskCityOnly(address: string): string {
  if (!address) return ''
  const parts = address.trim().split(/\s+/)
  const first = parts[0]

  // 특별시 / 광역시 / 특별자치시 — 첫 단어 자체가 시
  if (first.endsWith('특별시') || first.endsWith('광역시') || first.endsWith('특별자치시')) {
    return first
  }
  // 도 / 특별자치도 — 두 번째 단어가 시·군
  if (first.endsWith('도')) {
    return parts[1] ?? first
  }
  // 알 수 없는 형식 — 첫 단어만
  return first
}
