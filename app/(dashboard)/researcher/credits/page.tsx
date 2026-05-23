import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditRewardsView, type CreditRule, type LedgerEntry } from '@/components/credit-rewards-view'
import { getQuotaStatus } from '@/lib/quota-display'

export default async function ResearcherCreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: rules }, { data: ledger }, quota] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('researcher_profiles').select('credits').eq('user_id', user.id).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('credit_rules')
      .select('key, role, label, description, points, frequency_type, frequency_limit')
      .eq('role', 'researcher')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('credit_ledger')
      .select('id, rule_key, delta, balance_after, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    getQuotaStatus(user.id, 'researcher'),
  ])

  return (
    <CreditRewardsView
      role="researcher"
      credits={profile?.credits ?? 0}
      rules={(rules ?? []) as CreditRule[]}
      ledger={(ledger ?? []) as LedgerEntry[]}
      quota={quota}
    />
  )
}
