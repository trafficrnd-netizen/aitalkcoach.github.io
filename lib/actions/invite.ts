'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { getOrCreateReferralCode } from '@/lib/referral'
import { revalidatePath } from 'next/cache'
import type { Role } from '@/lib/credits'

const MAX_EMAILS_PER_BATCH = 10

/**
 * 친구 초대 이메일 발송 — 최대 10명
 */
export async function sendInviteEmails(
  emailsRaw: string[]
): Promise<{ success?: true; sent?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const role: Role = user.user_metadata?.user_type === 'supplier' ? 'supplier' : 'researcher'

  // 이메일 정제·검증
  const emails = Array.from(
    new Set(
      emailsRaw
        .map(e => (e || '').trim().toLowerCase())
        .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  )
  if (emails.length === 0) return { error: '올바른 이메일을 한 개 이상 입력해주세요.' }
  if (emails.length > MAX_EMAILS_PER_BATCH) {
    return { error: `한 번에 최대 ${MAX_EMAILS_PER_BATCH}명까지 초대할 수 있습니다.` }
  }
  if (emails.includes((user.email ?? '').toLowerCase())) {
    return { error: '본인 이메일은 초대할 수 없습니다.' }
  }

  const code = await getOrCreateReferralCode(user.id, role)
  if (!code) return { error: '초대 코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' }

  const signupPath = role === 'supplier' ? '/signup/supplier' : '/signup/researcher'
  const inviteUrl = `https://ai-traffic.kr${signupPath}?ref=${code}`
  const roleLabel = role === 'supplier' ? '공급자' : '연구자'

  const admin = createAdminClient()
  let sent = 0

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: '[ai-traffic.kr] 연구물품 견적 플랫폼에 초대합니다',
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#1A2236;">
            <h2 style="color:#1E2F52;margin-bottom:12px;font-size:20px;">ai-traffic.kr 초대장</h2>
            <p style="font-size:14px;line-height:1.6;color:#2A3247;">
              동료가 회원님을 <strong>${roleLabel}</strong>로 ai-traffic.kr에 초대했습니다.
            </p>
            <p style="font-size:14px;line-height:1.6;color:#2A3247;">
              ai-traffic.kr은 시약·소모품·장비를 역경매 방식으로 조달하는 B2B 플랫폼입니다.
              아래 버튼으로 가입하면 초대가 자동 연결됩니다.
            </p>
            <a href="${inviteUrl}"
               style="display:inline-block;background:#F4A261;color:#1A2236;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
              초대 수락하고 가입하기 →
            </a>
            <p style="font-size:12px;color:#6b7280;margin-top:8px;">
              초대 코드: <strong>${code}</strong>
            </p>
            <hr style="border:none;border-top:1px solid #E5DECD;margin:24px 0;"/>
            <p style="font-size:11px;color:#9ca3af;">ai-traffic.kr · 연구물품 통합 견적 플랫폼</p>
          </div>
        `,
      })

      // referrals 기록 (sent)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('referrals').insert({
        inviter_id: user.id,
        inviter_role: role,
        code,
        invitee_email: email,
        status: 'sent',
      })
      sent++
    } catch (e) {
      console.error('[sendInviteEmails] 발송 실패:', email, e)
    }
  }

  if (sent === 0) return { error: '초대 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' }

  revalidatePath('/researcher/invite')
  revalidatePath('/supplier/invite')
  return { success: true, sent }
}
