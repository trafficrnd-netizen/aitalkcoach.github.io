import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { FROM_EMAIL } from '@/lib/resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const file          = formData.get('bizDoc')         as File   | null
  const businessNumber = formData.get('businessNumber') as string | null
  const companyName   = formData.get('companyName')    as string | null
  const contactName   = formData.get('contactName')    as string | null
  const contactEmail  = formData.get('contactEmail')   as string | null
  const contactPhone  = formData.get('contactPhone')   as string | null

  if (!file || !businessNumber || !companyName || !contactEmail) {
    return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'JPG · PNG · WEBP · HEIC · PDF 파일만 업로드할 수 있습니다.' },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '파일 크기는 8 MB 이하여야 합니다.' }, { status: 400 })
  }

  // ── 메모리에서 Buffer로 변환 (서버 디스크/스토리지 저장 없음) ──
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const bnoFormatted = businessNumber.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bidvibe.ai-traffic.kr'
  const receivedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
      <h2 style="font-size:18px;margin-bottom:16px">📋 공급자 심사 요청 — ${companyName}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#f9fafb;width:130px;font-weight:600">회사명</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb">${companyName}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">사업자번호</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:700;color:#4f46e5">${bnoFormatted}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">담당자</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb">${contactName ?? '-'}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">이메일</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb">${contactEmail}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">휴대폰</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb">${contactPhone ?? '-'}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">접수 시각</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb">${receivedAt}</td>
        </tr>
      </table>

      <p style="margin-top:20px;font-size:13px;color:#6b7280;line-height:1.6">
        첨부된 사업자등록증 이미지를 확인하시고,
        사업자번호 <strong style="color:#1a1a2e">${bnoFormatted}</strong>와 일치하면 어드민에서 <strong>승인</strong>해주세요.
      </p>

      <p style="margin-top:16px">
        <a href="${appUrl}/admin/dashboard"
           style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
          어드민 대시보드에서 처리하기 →
        </a>
      </p>

      <p style="margin-top:24px;font-size:11px;color:#9ca3af">
        이 메일은 BidVibe 공급자 가입 심사 자동 발송입니다. 서버에는 원본 파일이 저장되지 않습니다.
      </p>
    </div>
  `

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'sales@ai-traffic.kr',
      subject: `[심사 요청] ${companyName} (${bnoFormatted})`,
      html,
      attachments: [
        {
          filename: file.name || `biz-doc-${businessNumber}.jpg`,
          content: buffer,
        },
      ],
    })

    if (error) {
      console.error('[supplier-doc-upload] Resend 오류:', error)
      return NextResponse.json({ error: '서류 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 })
    }
  } catch (err) {
    console.error('[supplier-doc-upload] 예외:', err)
    return NextResponse.json({ error: '서류 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 })
  }

  // buffer는 여기서 스코프를 벗어나 GC 처리 — 서버에 남지 않음
  return NextResponse.json({ ok: true })
}
