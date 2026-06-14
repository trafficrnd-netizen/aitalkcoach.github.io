import { Bell } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export default function ResearcherNotificationsPage() {
  const t = getServerT()
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('not.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('not.sub')}</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
        <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">{t('not.empty')}</p>
        <p className="text-sm mt-1">{t('not.emptySub')}</p>
      </div>
    </div>
  )
}
