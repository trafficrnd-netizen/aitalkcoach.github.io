import { Settings } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

export default function MediSupplierSettingsPage() {
  const t = getServerT()
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('sb.settings')}</h1>
      </div>
      <p className="text-muted-foreground text-sm">{t('medi.supplier.settingsComingSoon')}</p>
    </div>
  )
}
