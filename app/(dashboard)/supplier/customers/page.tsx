import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupplierCustomers, getSupplierCoupons, getCouponRequests } from '@/lib/actions/supplier-crm'
import { CrmView } from '@/components/crm-view'
import { getServerT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export default async function SupplierCustomersPage() {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [customers, coupons, couponRequests] = await Promise.all([
    getSupplierCustomers(),
    getSupplierCoupons(),
    getCouponRequests(),
  ])

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">{t('crm.title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('crm.sub')}
      </p>
      <CrmView
        customers={'error' in customers ? [] : customers}
        coupons={coupons}
        couponRequests={couponRequests}
      />
    </div>
  )
}
