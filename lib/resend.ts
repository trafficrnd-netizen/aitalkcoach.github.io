import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = 'BidVibe <noreply@ai-traffic.kr>'

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[]
  subject: string
  react: React.ReactElement
}) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    react,
  })

  if (error) {
    console.error('[Resend] 이메일 발송 실패:', error)
    throw error
  }

  return data
}
