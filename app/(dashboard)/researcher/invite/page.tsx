import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateReferralCode } from '@/lib/referral'
import { InviteView, type ReferralRow } from '@/components/invite-view'

export default async function ResearcherInvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = (await getOrCreateReferralCode(user.id, 'researcher')) ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referrals } = await (supabase as any)
    .from('referrals')
    .select('id, invitee_email, status, created_at, joined_at')
    .eq('inviter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const inviteLink = `https://ai-traffic.kr/signup/researcher?ref=${code}`

  return (
    <InviteView
      code={code}
      inviteLink={inviteLink}
      rewardPoints={5}
      referrals={(referrals ?? []) as ReferralRow[]}
    />
  )
}
