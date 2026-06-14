import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, Clock, Store } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getServerT } from '@/lib/i18n/server'

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:  { label: '검토중',  cls: 'bg-yellow-100 text-yellow-700 border-0' },
  accepted: { label: '수락됨',  cls: 'bg-emerald-100 text-emerald-700 border-0' },
  rejected: { label: '미선택',  cls: 'bg-muted text-muted-foreground' },
}

export default async function MediBidsPage() {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bids } = await (supabase as any)
    .from('bids')
    .select(`
      id, created_at, delivery_date, memo, status,
      requests!inner(id, title, deadline, delivery_city, status, vertical)
    `)
    .eq('supplier_id', user.id)
    .eq('vertical', 'aesthetic')
    .order('created_at', { ascending: false })
    .limit(50)

  const list = bids ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('medi.supplier.bidsTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('medi.supplier.bidsSub')}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center space-y-4 text-muted-foreground">
          <ClipboardList className="mx-auto h-8 w-8 opacity-30" />
          <p>{t('medi.supplier.bidsEmpty')}</p>
          <Link href="/medi-supplier/marketplace" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2' })}>
            <Store className="h-4 w-4" />
            {t('medi.supplier.ctaMarketplace')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((bid: {
            id: string
            created_at: string
            delivery_date: string | null
            memo: string | null
            status: string | null
            requests: { id: string; title: string; deadline: string | null; delivery_city: string | null; status: string }
          }) => {
            const req = bid.requests
            const statusInfo = STATUS_LABELS[bid.status ?? 'pending'] ?? STATUS_LABELS.pending
            const bidDate = new Date(bid.created_at).toLocaleDateString('ko-KR')
            const daysLeft = req.deadline
              ? Math.ceil((new Date(req.deadline).getTime() - Date.now()) / 86_400_000)
              : null

            return (
              <li key={bid.id} className="rounded-xl border border-border bg-card px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={statusInfo.cls}>{statusInfo.label}</Badge>
                      {req.status !== 'open' && (
                        <Badge variant="secondary" className="text-[10px]">마감</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm truncate">{req.title}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {req.delivery_city && <span>{req.delivery_city}</span>}
                      {daysLeft !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? '오늘 마감' : '마감'}
                        </span>
                      )}
                      <span className="text-muted-foreground/70">입찰 {bidDate}</span>
                    </div>
                    {bid.memo && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{bid.memo}</p>
                    )}
                  </div>
                  <Link
                    href={`/medi-supplier/bid/${req.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    {t('medi.supplier.bidView')}
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
