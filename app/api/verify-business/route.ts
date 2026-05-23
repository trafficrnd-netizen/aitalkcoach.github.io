import { NextResponse } from 'next/server'

interface NtsStatusItem {
  b_no: string
  b_stt: string      // 사업자 상태 (계속사업자 / 휴업자 / 폐업자)
  b_stt_cd: string   // 01: 계속, 02: 휴업, 03: 폐업
  tax_type: string
}

interface NtsResponse {
  status_code: string
  data: NtsStatusItem[]
  match_cnt: number
  request_cnt: number
}

export async function POST(request: Request) {
  const { businessNumber } = await request.json()

  if (!businessNumber || !/^\d{10}$/.test(businessNumber.replace(/-/g, ''))) {
    return NextResponse.json({ valid: false, message: '사업자번호 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const cleaned = businessNumber.replace(/-/g, '')
  const apiKey = process.env.NTS_API_KEY

  if (!apiKey) {
    // 개발 환경: API 키 없으면 형식만 검증
    return NextResponse.json({ valid: true, message: '(개발) 형식 검증만 통과', status: 'dev' })
  }

  try {
    const res = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ b_no: [cleaned] }),
      }
    )

    if (!res.ok) {
      return NextResponse.json({ valid: false, message: '국세청 API 오류가 발생했습니다.' }, { status: 502 })
    }

    const data: NtsResponse = await res.json()
    const item = data.data?.[0]

    if (!item) {
      return NextResponse.json({ valid: false, message: '사업자 정보를 찾을 수 없습니다.' })
    }

    if (item.b_stt_cd === '01') {
      return NextResponse.json({ valid: true, message: '정상 사업자입니다.', status: item.b_stt })
    } else {
      return NextResponse.json({ valid: false, message: `사업자 상태: ${item.b_stt}` })
    }
  } catch {
    return NextResponse.json({ valid: false, message: '인증 서버에 연결할 수 없습니다.' }, { status: 503 })
  }
}
