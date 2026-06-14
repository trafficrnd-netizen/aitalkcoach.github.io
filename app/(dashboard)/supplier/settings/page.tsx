import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SupplierProfileForm } from './supplier-profile-form'
import { getServerT } from '@/lib/i18n/server'
import { ChangePasswordForm } from '@/components/change-password-form'

export default async function SupplierSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('supplier_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const t = getServerT()
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">{t('sset.title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('sset.sub')}</p>
      <SupplierProfileForm profile={profile} />
      <div className="mt-8">
        <ChangePasswordForm />
      </div>
    </div>
  )
}
