import { NextResponse } from 'next/server'

export interface JusoResult {
  roadAddr: string
  jibunAddr: string
  zipNo: string
  bdNm: string
  siNm: string   // 시·도 (예: 서울특별시)
  sggNm: string  // 시군구 (예: 관악구)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')?.trim()

  if (!keyword || keyword.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const confmKey = process.env.JUSO_CONFIRM_KEY
  if (!confmKey) {
    return NextResponse.json({ error: 'JUSO_CONFIRM_KEY not configured', results: [] })
  }

  const url = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do')
  url.searchParams.set('confmKey', confmKey)
  url.searchParams.set('currentPage', '1')
  url.searchParams.set('countPerPage', '10')
  url.searchParams.set('keyword', keyword)
  url.searchParams.set('resultType', 'json')

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data = await res.json()
    const juso: JusoResult[] = data.results?.juso ?? []
    return NextResponse.json({ results: juso })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
