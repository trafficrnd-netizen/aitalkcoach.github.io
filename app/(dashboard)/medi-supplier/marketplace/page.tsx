import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Store, CheckCircle2, Clock, MapPin, Handshake } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getServerT } from '@/lib/i18n/server'

const ITEM_TYPE_LABELS: Record<string, string> = {
  device:  '기기소모품',
  hygiene: '위생/일회용',
  pack:    '팩/마스크',
  care:    '클렌징/케어',
  tool:    '시술도구',
  bed:     '베드/침대보호',
  textile: '타월/가운',
}

export default async function MediMarketplacePage() {
  const t = getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requests } = await (supabase as any)
    .from('requests')
    .select('id, title, deadline, delivery_city, notes, created_at, item_type, allow_negotiation')
    .eq('status', 'open')
    .eq('vertical', 'aesthetic')
    .order('created_at', { ascending: false })
    .limit(60)

  const reqIds: string[] = (requests ?? []).map((r: { id: string }) => r.id)
  const myBidSet = new Set<string>()
  if (reqIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: myBids } = await (supabase as any)
      .from('bids')
      .select('request_id')
      .eq('supplier_id', user.id)
      .in('request_id', reqIds)
    for (const b of (myBids ?? [])) myBidSet.add(b.request_id)
  }

  const list = requests ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('medi.supplier.mktTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('medi.supplier.mktSub')}</p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          {t('medi.supplier.mktCount').replace('{n}', String(list.length))}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Store className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p>{t('medi.supplier.mktEmpty')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((req: {
            id: string
            title: string
            deadline: string | null
            delivery_city: string | null
            notes: string | null
            created_at: string
            item_type: string | null
            allow_negotiation: boolean | null
          }) => {
            const alreadyBid = myBidSet.has(req.id)
            const daysLeft = req.deadline
              ? Math.ceil((new Date(req.deadline).getTime() - Date.now()) / 86_400_000)
              : null
            const itemLabel = ITEM_TYPE_LABELS[req.item_type ?? ''] ?? req.item_type ?? ''

            return (
              <li key={req.id} className="rounded-xl border border-border bg-card px-4 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {itemLabel && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{itemLabel}</Badge>
                      )}
                      {req.allow_negotiation && (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 gap-1 border-0">
                          <Handshake className="h-2.5 w-2.5" /> 흥정 가능
                        </Badge>
                      )}
                      {alreadyBid && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 gap-1 border-0">
                          <CheckCircle2 className="h-3 w-3" /> {t('medi.supplier.bidDone')}
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm truncate">{req.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {req.delivery_city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{req.delivery_city}
                        </span>
                      )}
                      {daysLeft !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? '오늘 마감' : '마감'}
                        </span>
                      )}
                    </div>
                    {req.notes && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{req.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {alreadyBid ? (
                      <Link
                        href={`/medi-supplier/bid/${req.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        {t('medi.supplier.bidView')}
                      </Link>
                    ) : (
                      <Link
                        href={`/medi-supplier/bid/${req.id}`}
                        className={buttonVariants({ size: 'sm' })}
                      >
                        {t('medi.supplier.bidCta')}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
