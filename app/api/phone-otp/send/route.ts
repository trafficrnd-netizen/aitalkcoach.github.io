import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

const OTP_TTL = 60 * 5 // 5분

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '')
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json()

  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: '전화번호를 입력해주세요.' }, { status: 400 })
  }

  const normalized = normalizePhone(phone)
  if (!/^0(1[016789])\d{7,8}$/.test(normalized)) {
    return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해주세요.' }, { status: 400 })
  }

  const receivingNumber = process.env.OCTOMO_RECEIVING_NUMBER
  if (!process.env.OCTOMO_API_KEY || !receivingNumber) {
    console.error('[phone-otp/send] OCTOMO_API_KEY 또는 OCTOMO_RECEIVING_NUMBER 미설정')
    return NextResponse.json({ error: '서비스 설정 오류입니다. 관리자에게 문의하세요.' }, { status: 500 })
  }

  const otp = generateOtp()

  // Redis에 저장 — verify 단계에서 Octomo 조회 시 대조에 사용
  await redis.set(`otp:${normalized}`, otp, { ex: OTP_TTL })

  // 코드와 수신번호를 클라이언트에 반환
  // (Octomo MO 방식: 서버가 SMS를 보내는 게 아니라 사용자가 직접 발송)
  return NextResponse.json({
    ok: true,
    code: otp,
    receivingNumber,
  })
}
