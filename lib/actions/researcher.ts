'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redis } from '@/lib/redis'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

interface NotificationEmailEntry {
  email: string
  label: string
  verified: boolean
  created_at: string
}

const MAX_NOTIFICATION_EMAILS = 5

/** 알림 수신용 이메일 추가 — 인증 링크 발송 */
export async function addNotificationEmail(
  emailRaw: string,
  labelRaw: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const email = (emailRaw || '').trim().toLowerCase()
  const label = (labelRaw || '').trim() || '추가 이메일'

  // 이메일 형식 검증
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: '올바른 이메일 형식이 아닙니다.' }
  }
  if (email === (user.email ?? '').toLowerCase()) {
    return { error: '가입 이메일과 동일합니다.' }
  }

  // 기존 목록 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('researcher_profiles')
    .select('notification_emails')
    .eq('user_id', user.id)
    .single()

  const existing: NotificationEmailEntry[] = profile?.notification_emails ?? []

  if (existing.length >= MAX_NOTIFICATION_EMAILS) {
    return { error: `최대 ${MAX_NOTIFICATION_EMAILS}개까지 등록할 수 있습니다.` }
  }
  if (existing.some(e => e.email === email)) {
    return { error: '이미 등록된 이메일입니다.' }
  }

  // unverified 항목 추가
  const newEntry: NotificationEmailEntry = {
    email,
    label: label.slice(0, 30),
    verified: false,
    created_at: new Date().toISOString(),
  }
  const newList = [...existing, newEntry]

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updError } = await (admin as any)
    .from('researcher_profiles')
    .update({ notification_emails: newList })
    .eq('user_id', user.id)
  if (updError) return { error: '저장 중 오류가 발생했습니다.' }

  // 인증 토큰 생성 + Redis 캐싱
  const token = randomBytes(24).toString('hex') // 48자 hex
  await redis.set(
    `verify_email:${token}`,
    JSON.stringify({ userId: user.id, email }),
    { ex: 60 * 60 * 24 } // 24시간
  )

  // 인증 메일 발송
  const verifyUrl = `https://ai-traffic.kr/api/researcher/verify-email?token=${token}`
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '[ai-traffic.kr] 견적 알림 이메일 인증',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#1A2236;">
          <h2 style="color:#1E2F52;margin-bottom:12px;font-size:20px;">견적 알림 수신 이메일 인증</h2>
          <p style="font-size:14px;line-height:1.6;color:#2A3247;">
            <strong>${label}</strong> 라벨로 이 이메일 주소(${email})를 ai-traffic.kr 견적 알림 수신용으로 등록 요청했습니다.
          </p>
          <p style="font-size:14px;line-height:1.6;color:#2A3247;">
            아래 버튼을 클릭하여 인증을 완료해주세요. 링크는 24시간 동안 유효합니다.
          </p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#F4A261;color:#1A2236;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
            이메일 인증하기 →
          </a>
          <p style="font-size:12px;color:#6b7280;margin-top:24px;">
            본인이 요청한 적이 없다면 이 메일을 무시하셔도 됩니다.<br/>
            인증 후 견적 알림이 이 이메일로도 발송됩니다.
          </p>
          <hr style="border:none;border-top:1px solid #E5DECD;margin:24px 0;"/>
          <p style="font-size:11px;color:#9ca3af;">ai-traffic.kr · 연구물품 통합 견적 플랫폼</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('[addNotificationEmail] Resend 발송 실패:', e)
    return { error: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  revalidatePath('/researcher/settings')
  return { success: true }
}

/** 알림 이메일 삭제 */
export async function removeNotificationEmail(
  email: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const target = email.trim().toLowerCase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('researcher_profiles')
    .select('notification_emails')
    .eq('user_id', user.id)
    .single()

  const existing: NotificationEmailEntry[] = profile?.notification_emails ?? []
  const newList = existing.filter(e => e.email !== target)

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('researcher_profiles')
    .update({ notification_emails: newList })
    .eq('user_id', user.id)

  if (error) return { error: '삭제 중 오류가 발생했습니다.' }

  revalidatePath('/researcher/settings')
  return { success: true }
}

/** 인증 메일 재발송 */
export async function resendVerificationEmail(
  email: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const target = email.trim().toLowerCase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('researcher_profiles')
    .select('notification_emails')
    .eq('user_id', user.id)
    .single()

  const existing: NotificationEmailEntry[] = profile?.notification_emails ?? []
  const found = existing.find(e => e.email === target)
  if (!found) return { error: '등록되지 않은 이메일입니다.' }
  if (found.verified) return { error: '이미 인증된 이메일입니다.' }

  const token = randomBytes(24).toString('hex')
  await redis.set(
    `verify_email:${token}`,
    JSON.stringify({ userId: user.id, email: target }),
    { ex: 60 * 60 * 24 }
  )

  const verifyUrl = `https://ai-traffic.kr/api/researcher/verify-email?token=${token}`
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: target,
      subject: '[ai-traffic.kr] 견적 알림 이메일 인증 (재발송)',
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#1E2F52;">이메일 인증 (재발송)</h2>
          <p>아래 버튼을 클릭하여 인증을 완료해주세요. 24시간 동안 유효합니다.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#F4A261;color:#1A2236;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">이메일 인증하기 →</a>
        </div>
      `,
    })
  } catch {
    return { error: '메일 발송에 실패했습니다.' }
  }

  return { success: true }
}
