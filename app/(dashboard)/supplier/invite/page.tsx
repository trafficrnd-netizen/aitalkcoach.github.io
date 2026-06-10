import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateReferralCode } from '@/lib/referral'
import { InviteView, type ReferralRow } from '@/components/invite-view'
import { SupplierProgramWidget } from '@/components/supplier-program-widget'
import { getSupplierProgramStatus } from '@/lib/actions/supplier-program'

export default async function SupplierInvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = (await getOrCreateReferralCode(user.id, 'supplier')) ?? ''

  const [referralsRes, programStatus] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('referrals')
      .select('id, invitee_email, invitee_role, status, created_at, joined_at')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    getSupplierProgramStatus(),
  ])

  return (
    <div className="space-y-6">
      {/* 전용 코드 프로그램 — 10명 초대 시 전용 채널 열림 */}
      {'count' in programStatus && (
        <SupplierProgramWidget status={programStatus} />
      )}
      <InviteView
        code={code}
        rewardPoints={3}
        referrals={(referralsRes.data ?? []) as ReferralRow[]}
      />
    </div>
  )
}
