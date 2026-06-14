'use client'

/**
 * 클라이언트에서 현재 경로의 버티컬을 알아내는 훅.
 * '/medi/*' 경로는 aesthetic, 그 외는 research.
 * 컴포넌트 재사용 시 브랜드/문구/무료여부 분기에 사용한다.
 */

import { usePathname } from 'next/navigation'
import { verticalFromPath, getVertical, isFree, type Vertical, type VerticalConfig } from '@/lib/verticals'

export function useVertical(): Vertical {
  return verticalFromPath(usePathname() ?? '')
}

export function useVerticalConfig(): VerticalConfig {
  return getVertical(useVertical())
}

export function useIsFreeVertical(): boolean {
  return isFree(useVertical())
}
