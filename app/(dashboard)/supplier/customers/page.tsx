import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupplierCustomers, getSupplierCoupons } from '@/lib/actions/supplier-crm'
import { CrmView } from '@/components/crm-view'

export const dynamic = 'force-dynamic'

export default async function SupplierCustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [customers, coupons] = await Promise.all([
    getSupplierCustomers(),
    getSupplierCoupons(),
  ])

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">고객 관리</h1>
      <p className="text-sm text-muted-foreground mb-6">
        유치한 고객(팔로워)을 관리하고, 할인 쿠폰으로 지속 거래를 유도하세요.
      </p>
      <CrmView
        customers={'error' in customers ? [] : customers}
        coupons={coupons}
      />
    </div>
  )
}
