import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { getServerT, getServerLang } from '@/lib/i18n/server'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  closed: 'secondary',
  expired: 'outline',
  cancelled: 'outline',
}

export default async function ResearcherRequestsPage() {
  const t = getServerT()
  const lang = getServerLang()
  const STATUS_LABEL: Record<string, string> = {
    open: t('dash.status.open'),
    closed: t('dash.status.closed'),
    expired: t('dash.status.expired'),
    cancelled: t('dash.status.cancelled'),
  }
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requests } = await (supabase as any)
    .from('requests')
    .select('id, title, type, status, deadline, created_at')
    .eq('researcher_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('dash.myRequestsTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('dash.totalCount').replace('{n}', String(requests?.length ?? 0))}</p>
        </div>
        <Link href="/researcher/request" className={buttonVariants({ size: 'sm' })}>
          {t('dash.newRequest')}
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground mb-4">{t('dash.empty.requests')}</p>
          <Link href="/researcher/request" className={buttonVariants()}>
            {t('dash.firstRequestCta')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(requests as any[]).map((req) => (
            <li key={req.id}>
              <Link href={`/researcher/requests/${req.id}`} className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[req.status] ?? 'outline'}>
                    {STATUS_LABEL[req.status] ?? req.status}
                  </Badge>
                  <span className="font-medium">{req.title ?? t('dash.noTitle')}</span>
                  <span className="text-xs text-muted-foreground">
                    {req.type === 'single' ? t('dash.typeSingle') : t('dash.typeBatch')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {req.deadline
                    ? `${t('dash.deadlinePrefix')} ${req.deadline}`
                    : new Date(req.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR')}
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
