import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateReferralCode } from '@/lib/referral'
import { InviteView, type ReferralRow } from '@/components/invite-view'
import { LabGroupWidget } from '@/components/lab-group-widget'
import { getLabGroupStatus } from '@/lib/actions/lab-group'

export default async function ResearcherInvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = (await getOrCreateReferralCode(user.id, 'researcher')) ?? ''

  const [referralsRes, labStatus] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('referrals')
      .select('id, invitee_email, invitee_role, status, created_at, joined_at')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    getLabGroupStatus(),
  ])

  return (
    <div className="space-y-6">
      {/* 랩 그룹 — 같은 기관·학과 5명 인증 시 그룹 형성 */}
      {'peerCount' in labStatus && <LabGroupWidget status={labStatus} />}
      <InviteView
        code={code}
        rewardPoints={3}
        referrals={(referralsRes.data ?? []) as ReferralRow[]}
      />
    </div>
  )
}
