import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function MediSupplierLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplier } = await (supabase as any)
    .from('supplier_profiles')
    .select('company_name')
    .eq('user_id', user.id)
    .single()

  if (!supplier) redirect('/signup/medi-supplier')

  return (
    <div className="flex min-h-screen">
      <Sidebar role="medi-supplier" />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
