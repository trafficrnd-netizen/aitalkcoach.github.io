import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Store, ClipboardList, CheckCircle2, ShoppingBag } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export default async function MediSupplierDashboard() {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 내 입찰 수 + 수락된 입찰 수
  const [{ count: bidCount }, { count: acceptedCount }, { count: openReqCount }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('bids').select('*', { count: 'exact', head: true })
      .eq('supplier_id', user.id).eq('vertical', 'aesthetic'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('bids').select('*', { count: 'exact', head: true })
      .eq('supplier_id', user.id).eq('vertical', 'aesthetic').eq('status', 'accepted'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('requests').select('*', { count: 'exact', head: true })
      .eq('status', 'open').eq('vertical', 'aesthetic'),
  ])

  const stats = [
    { label: t('medi.supplier.statOpenReqs'), value: openReqCount ?? 0, icon: ShoppingBag },
    { label: t('medi.supplier.statMyBids'), value: bidCount ?? 0, icon: ClipboardList },
    { label: t('medi.supplier.statAccepted'), value: acceptedCount ?? 0, icon: CheckCircle2 },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('medi.supplier.dashTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('medi.supplier.dashSub')}</p>
      </div>

      {/* 무료 배지 */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-sm text-emerald-700 font-medium">{t('medi.supplier.freeBadge')}</span>
      </div>

      {/* 통계 카드 */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-4 text-center">
            <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/medi-supplier/marketplace" className={buttonVariants({ size: 'lg', className: 'gap-2 flex-1 justify-center' })}>
          <Store className="h-4 w-4" />
          {t('medi.supplier.ctaMarketplace')}
        </Link>
        <Link href="/medi-supplier/bids" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'gap-2 flex-1 justify-center' })}>
          <ClipboardList className="h-4 w-4" />
          {t('medi.supplier.ctaBids')}
        </Link>
      </div>
    </div>
  )
}
