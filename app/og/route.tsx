import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * OG 카드 이미지 (1200×630) — 글자 노출 극대화 디자인
 *   /og?title=...&sub=...
 * 글자 크기를 크게, 여백을 줄여 카드에서 텍스트가 최대한 많이/크게 보이도록 구성.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') || '요청하면 견적이 다~ 온다').slice(0, 40)
  const sub = (searchParams.get('sub') || '연구자-공급사 매칭 · 수수료 없는 비공개 역경매').slice(0, 60)

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1E2F52 0%, #24386180 60%, #1E2F52 100%)',
          padding: '64px 72px',
          fontFamily: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
        }}
      >
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              background: '#F4A261',
              borderRadius: '14px',
              padding: '8px 22px',
              fontSize: '34px',
              fontWeight: 800,
              color: '#1E2F52',
              letterSpacing: '-0.5px',
            }}
          >
            BidVibe
          </div>
          <div style={{ fontSize: '24px', color: '#2A9D8F', fontWeight: 600 }}>ai-traffic.kr</div>
        </div>

        {/* 메인 카피 — 큰 글자 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: title.length > 16 ? '88px' : '104px',
              fontWeight: 800,
              color: '#F3EDE2',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '40px',
              fontWeight: 600,
              color: '#F4A261',
              lineHeight: 1.3,
            }}
          >
            {sub}
          </div>
        </div>

        {/* 하단 배지 */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div
            style={{
              background: '#2A9D8F',
              color: '#FFFFFF',
              borderRadius: '999px',
              padding: '12px 28px',
              fontSize: '26px',
              fontWeight: 700,
            }}
          >
            🔬 연구자 완전 무료
          </div>
          <div
            style={{
              background: 'rgba(244,162,97,0.18)',
              color: '#F4A261',
              borderRadius: '999px',
              padding: '12px 28px',
              fontSize: '26px',
              fontWeight: 700,
            }}
          >
            🎁 공급사 Pro 1개월 무료
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
