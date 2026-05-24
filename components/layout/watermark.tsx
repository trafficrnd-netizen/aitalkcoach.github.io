'use client'

import { useMemo, useEffect, useState } from 'react'

interface Props {
  email?: string
}

const WATERMARK_TEXT_1 = 'BidVibe'
const WATERMARK_TEXT_2 = 'ai-traffic.kr'

export function Watermark({ email }: Props) {
  // 워터마크 표시 여부 — 평소엔 숨김, 캡처 시 표시
  const [show, setShow] = useState(false)

  useEffect(() => {
    // ── 1. 화면 공유(getDisplayMedia) 감지 ─────────────────────────────
    // Zoom·Teams·OBS 등 화면 공유 시작 시 워터마크 표시
    let shareStream: MediaStream | null = null
    const origGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(
      navigator.mediaDevices
    )
    if (origGetDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = async function (
        ...args: Parameters<typeof origGetDisplayMedia>
      ) {
        setShow(true)
        shareStream = await origGetDisplayMedia(...args)
        // 공유 종료 시 워터마크 숨김
        shareStream.getVideoTracks()[0]?.addEventListener('ended', () => {
          setShow(false)
          shareStream = null
        })
        return shareStream
      }
    }

    // ── 2. 탭 숨김·전환 감지 ────────────────────────────────────────────
    // Windows Snipping Tool, 일부 캡처 앱이 탭을 백그라운드로 보냄
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        setShow(true)
        // 탭이 다시 보일 때까지 or 1.5초 후 해제
        const timer = setTimeout(() => setShow(false), 1500)
        document.addEventListener(
          'visibilitychange',
          () => {
            if (document.visibilityState === 'visible') {
              clearTimeout(timer)
              setShow(false)
            }
          },
          { once: true }
        )
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    // ── 3. Print (Ctrl+P / PDF 저장) ────────────────────────────────────
    // @media print CSS로 처리 (아래 참조)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      // getDisplayMedia 원복
      if (origGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = origGetDisplayMedia
      }
      shareStream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // 타일 좌표 — 뷰포트 전체 커버 (벽돌 패턴)
  const tiles = useMemo(() => {
    const items: { top: number; left: number; key: string }[] = []
    const colW = 380
    const rowH = 200
    const cols = 8
    const rows = 10
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
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
    <>
      {/* JS 감지: 화면 공유·탭 숨김 시 표시 */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none select-none overflow-hidden"
        style={{
          zIndex: 9998,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      >
        {tiles.map(({ key, top, left }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top,
              left,
              transform: 'rotate(-25deg)',
              userSelect: 'none',
              lineHeight: 1.5,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '23px',
                fontWeight: 800,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.03em',
                color: '#1E2F52',
                opacity: 0.45,
              }}
            >
              {WATERMARK_TEXT_1}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.06em',
                color: '#1E2F52',
                opacity: 0.45,
              }}
            >
              {WATERMARK_TEXT_2}
            </p>
          </div>
        ))}
      </div>

      {/* Print 전용 워터마크 — @media print에서만 보임 */}
      <div
        aria-hidden="true"
        className="watermark-print fixed inset-0 pointer-events-none select-none overflow-hidden"
        style={{ zIndex: 9999 }}
      >
        {tiles.map(({ key, top, left }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top,
              left,
              transform: 'rotate(-25deg)',
              userSelect: 'none',
              lineHeight: 1.5,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '23px',
                fontWeight: 800,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.03em',
                color: '#1E2F52',
              }}
            >
              {WATERMARK_TEXT_1}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.06em',
                color: '#1E2F52',
              }}
            >
              {WATERMARK_TEXT_2}
            </p>
            {email && (
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: '"SF Mono", monospace',
                  color: '#1E2F52',
                  opacity: 0.7,
                }}
              >
                {email}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
