import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

const VERIFIED_TTL = 60 * 30 // 30분 — 이 시간 안에 가입 완료해야 함

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '')
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json()

  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: '전화번호를 입력해주세요.' }, { status: 400 })
  }

  const normalized = normalizePhone(phone)

  // Redis에서 발급한 코드 조회
  const storedCode = await redis.get<string>(`otp:${normalized}`)
  if (!storedCode) {
    return NextResponse.json(
      { error: '인증 코드가 만료되었습니다. 다시 시도해주세요.' },
      { status: 400 },
    )
  }

  const apiKey = process.env.OCTOMO_API_KEY
  if (!apiKey) {
    console.error('[phone-otp/verify] OCTOMO_API_KEY 미설정')
    return NextResponse.json({ error: '서비스 설정 오류입니다.' }, { status: 500 })
  }

  // Octomo MO 수신 확인 API
  // 사용자가 storedCode 를 Octomo 수신번호로 발송했는지 확인
  let octomoRes: Response
  try {
    octomoRes = await fetch(
      'https://api.octoverse.kr/octomo/v1/public/message/exists',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Octomo ${apiKey}`,
        },
        body: JSON.stringify({ mobileNum: normalized, text: storedCode }),
      },
    )
  } catch (err) {
    console.error('[phone-otp/verify] Octomo 연결 실패:', err)
    return NextResponse.json(
      { error: '인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' },
      { status: 503 },
    )
  }

  if (!octomoRes.ok) {
    const body = await octomoRes.text().catch(() => '')
    console.error('[phone-otp/verify] Octomo API 오류:', octomoRes.status, body)
    return NextResponse.json(
      { error: '인증 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    )
  }

  const result = await octomoRes.json() as { exists: boolean }

  if (!result.exists) {
    return NextResponse.json(
      { error: '문자 수신이 확인되지 않았습니다. 코드를 발송하신 후 다시 시도해주세요.' },
      { status: 400 },
    )
  }

  // 인증 완료 — OTP 삭제, verified 플래그 30분 유지
  await redis.del(`otp:${normalized}`)
  await redis.set(`otp:verified:${normalized}`, '1', { ex: VERIFIED_TTL })

  return NextResponse.json({ ok: true })
}
