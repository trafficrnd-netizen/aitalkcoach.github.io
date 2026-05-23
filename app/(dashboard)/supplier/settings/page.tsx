import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SupplierProfileForm } from './supplier-profile-form'

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

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">프로필 설정</h1>
      <p className="text-sm text-muted-foreground mb-8">회사 정보와 취급 품목을 관리합니다.</p>
      <SupplierProfileForm profile={profile} />
    </div>
  )
}
