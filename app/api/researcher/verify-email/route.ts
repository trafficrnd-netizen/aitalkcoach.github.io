import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { createAdminClient } from '@/lib/supabase/admin'

interface NotificationEmailEntry {
  email: string
  label: string
  verified: boolean
  created_at: string
}

interface TokenPayload {
  userId: string
  email: string
}

/**
 * 알림 이메일 인증 링크 처리
 * GET /api/researcher/verify-email?token=...
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return redirectWithError(req, '잘못된 접근입니다.')
  }

  const cached = await redis.get(`verify_email:${token}`)
  if (!cached) {
    return redirectWithError(req, '인증 링크가 만료되었거나 잘못되었습니다.')
  }

  let payload: TokenPayload
  try {
    payload = typeof cached === 'string' ? JSON.parse(cached) : (cached as TokenPayload)
  } catch {
    return redirectWithError(req, '인증 데이터가 손상되었습니다.')
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: readErr } = await (admin as any)
    .from('researcher_profiles')
    .select('notification_emails')
    .eq('user_id', payload.userId)
    .single()

  if (readErr || !profile) {
    return redirectWithError(req, '프로필을 찾을 수 없습니다.')
  }

  const list: NotificationEmailEntry[] = profile.notification_emails ?? []
  const targetEmail = payload.email.toLowerCase()
  const updatedList = list.map(e =>
    e.email.toLowerCase() === targetEmail ? { ...e, verified: true } : e
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updErr } = await (admin as any)
    .from('researcher_profiles')
    .update({ notification_emails: updatedList })
    .eq('user_id', payload.userId)

  if (updErr) {
    return redirectWithError(req, '인증 처리 중 오류가 발생했습니다.')
  }

  // 사용된 토큰 즉시 폐기
  await redis.del(`verify_email:${token}`)

  return NextResponse.redirect(new URL('/researcher/settings?verified=1', req.url))
}

function redirectWithError(req: NextRequest, message: string) {
  const url = new URL('/researcher/settings', req.url)
  url.searchParams.set('verify_error', encodeURIComponent(message))
  return NextResponse.redirect(url)
}
