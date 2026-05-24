'use client'

import { useMemo } from 'react'

interface Props {
  email: string
}

/**
 * DOM 기반 반복 워터마크.
 * Canvas toDataURL 대신 절대위치 span 배열로 구현 — 렌더링 누락 없음.
 * 스크린샷에도 식별 가능한 투명도(12%) 적용.
 */
export function Watermark({ email }: Props) {
  // 뷰포트를 채울 타일 좌표 생성 (빌드 타임 고정, 이메일로 seed)
  const tiles = useMemo(() => {
    const items: { top: number; left: number; key: string }[] = []
    const colW = 340
    const rowH = 160
    const cols = 8
    const rows = 10
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 홀수 행은 반 칸 오프셋 (벽돌 패턴)
        const offset = r % 2 === 1 ? colW / 2 : 0
        items.push({
          key: `${r}-${c}`,
          top: r * rowH - rowH,
          left: c * colW - colW + offset,
        })
      }
    }
    return items
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 9998 }}
    >
      {tiles.map(({ key, top, left }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            top,
            left,
            transform: 'rotate(-25deg)',
            opacity: 0.12,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            lineHeight: 1.6,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '11.5px',
              fontWeight: 700,
              fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
              letterSpacing: '0.04em',
              color: '#1E2F52',
            }}
          >
            {email}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '10px',
              fontWeight: 600,
              fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
              letterSpacing: '0.08em',
              color: '#1E2F52',
            }}
          >
            ai-traffic.kr
          </p>
        </div>
      ))}
    </div>
  )
}
