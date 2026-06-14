import { BarChart3 } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export default function SupplierStatsPage() {
  const t = getServerT()
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('sstat.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('sstat.sub')}</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">{t('sstat.empty')}</p>
        <p className="text-sm mt-1">{t('sstat.emptySub')}</p>
      </div>
    </div>
  )
}
