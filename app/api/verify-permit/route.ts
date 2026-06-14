import { NextRequest, NextResponse } from 'next/server'

export type VerifyStatus = 'valid' | 'not_found' | 'invalid' | 'link' | 'error' | 'unsupported'

export interface VerifyResult {
  status: VerifyStatus
  message: string
  url?: string
}

// ─── REACH 등록번호 형식: 01-XXXXXXXXXX-XX-XXXX ───────────────────────────
const REACH_FORMAT = /^01-\d{10}-\d{2}-\d{4}$/

async function verifyReach(regNo: string): Promise<VerifyResult> {
  const trimmed = regNo.trim().toUpperCase()

  if (!REACH_FORMAT.test(trimmed)) {
    return {
      status: 'invalid',
      message: `형식 오류 — 올바른 형식: 01-XXXXXXXXXX-XX-XXXX (예: 01-2119475521-33-0024)`,
    }
  }

  // ECHA 등록물질 검색 URL (서버사이드 fetch 시도)
  const searchUrl = `https://echa.europa.eu/search-for-chemicals/-/dislist/registration-number/${encodeURIComponent(trimmed)}`

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BidVibe/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    })

    if (res.ok) {
      const html = await res.text()
      // ECHA 결과 없음 패턴
      const noResult =
        html.includes('No results found') ||
        html.includes('no results') ||
        html.includes('0 results') ||
        html.includes('Your search did not return any results')

      if (noResult) {
        return {
          status: 'not_found',
          message: 'ECHA 데이터베이스에 해당 등록번호가 없습니다. 번호를 다시 확인해주세요.',
          url: 'https://echa.europa.eu/information-on-chemicals/registered-substances',
        }
      }

      // 결과가 있는 경우
      if (html.includes(trimmed) || html.includes('registered-dossier')) {
        return {
          status: 'valid',
          message: 'ECHA 데이터베이스에서 등록번호가 확인되었습니다.',
          url: searchUrl,
        }
      }
    }
  } catch {
    // fetch 실패 시 링크로 폴백
  }

  // 형식은 유효하지만 실시간 확인 불가 → 링크 제공
  return {
    status: 'link',
    message: '형식 유효. ECHA 공식 데이터베이스에서 직접 확인해주세요.',
    url: searchUrl,
  }
}

// ─── CCC 인증번호 형식: 보통 17자리 숫자 (YYYY + 3자리 + 10자리) ──────────
// 예) 2023010XXXXXXXXXX (17자리)
const CCC_FORMAT = /^\d{15,20}$/

async function verifyCCC(certNo: string): Promise<VerifyResult> {
  const trimmed = certNo.trim().replace(/\s/g, '')

  if (!CCC_FORMAT.test(trimmed)) {
    return {
      status: 'invalid',
      message: `형식 오류 — CCC 인증번호는 15~20자리 숫자입니다. (예: 2023010XXXXXXXXXX)`,
    }
  }

  // CNCA 공식 조회 페이지 URL
  const cnca3cUrl = `https://www.cnca.gov.cn/bsdt/xxcx/rzcxpt/?type=3C&certno=${encodeURIComponent(trimmed)}`

  try {
    // CNCA 서버사이드 fetch 시도 (중국 당국 사이트, 응답 불안정 가능)
    const res = await fetch('https://cx.cnca.cn/CertECloud/index/index/page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; BidVibe/1.0)',
        'Accept': 'application/json, text/javascript, */*',
        'Referer': 'https://cx.cnca.cn/',
      },
      body: `certno=${encodeURIComponent(trimmed)}&pageIndex=1&pageSize=10`,
      signal: AbortSignal.timeout(7000),
    })

    if (res.ok) {
      const text = await res.text()
      let data: unknown
      try { data = JSON.parse(text) } catch { data = null }

      if (data && typeof data === 'object' && data !== null) {
        const d = data as Record<string, unknown>
        // CNCA API가 결과를 반환하는 경우
        const total = d.total ?? (d.data as Record<string, unknown>)?.total
        if (Number(total) > 0) {
          return { status: 'valid', message: 'CNCA 데이터베이스에서 CCC 인증이 확인되었습니다.', url: cnca3cUrl }
        }
        if (Number(total) === 0) {
          return { status: 'not_found', message: 'CNCA에서 해당 인증번호를 찾을 수 없습니다. 번호를 다시 확인하거나 CNCA 공식 사이트에서 직접 조회해주세요.', url: cnca3cUrl }
        }
      }
    }
  } catch {
    // CNCA 서버 미응답 → 링크로 폴백
  }

  return {
    status: 'link',
    message: '형식 유효. CNCA 공식 인증정보 조회 시스템에서 직접 확인해주세요.',
    url: cnca3cUrl,
  }
}

// ─── 라우트 핸들러 ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { regType?: string; value?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ status: 'error', message: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { regType, value } = body
  if (!regType || !value) {
    return NextResponse.json({ status: 'error', message: 'regType과 value가 필요합니다.' }, { status: 400 })
  }

  let result: VerifyResult

  switch (regType) {
    case 'EU_REACH':
      result = await verifyReach(value)
      break

    case 'EU_CLP':
      // C&L 신고는 별도 번호 없음 — ECHA C&L Inventory 링크 제공
      result = {
        status: 'link',
        message: 'ECHA C&L Inventory에서 물질명/CAS 번호로 분류 정보를 확인할 수 있습니다.',
        url: 'https://echa.europa.eu/information-on-chemicals/cl-inventory-database',
      }
      break

    case 'CN_CCC':
      result = await verifyCCC(value)
      break

    case 'KR_KC': {
      // KC 인증정보시스템 링크
      const kcUrl = `https://kcmark.kr/certSearch.do?certNo=${encodeURIComponent(value.trim())}`
      result = {
        status: 'link',
        message: '국가기술표준원 KC 인증정보시스템에서 직접 확인해주세요.',
        url: kcUrl,
      }
      break
    }

    case 'US_FCC': {
      // FCC ID 검색
      const fccUrl = `https://www.fcc.gov/oet/ea/fccid?fcc_id=${encodeURIComponent(value.trim())}`
      result = {
        status: 'link',
        message: 'FCC ID Search에서 직접 확인해주세요.',
        url: fccUrl,
      }
      break
    }

    default:
      result = { status: 'unsupported', message: '해당 항목은 자동 조회를 지원하지 않습니다.' }
  }

  return NextResponse.json(result)
}
