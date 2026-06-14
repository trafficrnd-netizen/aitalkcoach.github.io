import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') || '요청하면 견적이 다~ 온다').slice(0, 40)
  const sub = (searchParams.get('sub') || '연구자-공급사 매칭 플랫폼').slice(0, 60)

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

        {/* 메인 카피 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div
            style={{
              fontSize: '76px',
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
              fontSize: '64px',
              fontWeight: 700,
              color: '#F4A261',
              lineHeight: 1.1,
              letterSpacing: '-1px',
            }}
          >
            {sub}
          </div>
        </div>

        {/* 하단 여백 균형용 */}
        <div style={{ display: 'flex' }} />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
