import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

const PLAN_LABEL: Record<string, string> = {
  free: 'Free (Beta)',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default async function SupplierBillingPage() {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('supplier_profiles')
    .select('plan, early_bird, credits')
    .eq('user_id', user.id)
    .maybeSingle()

  const plan = profile?.plan ?? 'free'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('bill.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('bill.sub')}</p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground mb-1">{t('bill.currentPlan')}</p>
          <p className="text-2xl font-bold text-primary">{PLAN_LABEL[plan] ?? plan}</p>
          {profile?.early_bird && (
            <p className="mt-1 text-sm text-amber-600 font-medium">{t('bill.earlybird')}</p>
          )}
          <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
            <p>{t('bill.betaDesc1')}</p>
            <p>{t('bill.betaDesc2')}</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
          <p className="font-medium text-sm">{t('bill.paymentPrep')}</p>
          <p className="text-xs mt-1">{t('bill.paymentPrepSub')}</p>
        </div>
      </div>
    </div>
  )
}
