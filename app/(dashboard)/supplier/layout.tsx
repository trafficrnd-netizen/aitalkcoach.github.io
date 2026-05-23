import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 사이드바 크레딧 위젯용 잔액 조회
  let credits = 0
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('supplier_profiles')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle()
      credits = data?.credits ?? 0
    }
  } catch {
    credits = 0
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="supplier" credits={credits} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Spacer for mobile fixed top bar (h-14). Hidden on md+ where sidebar is static. */}
        <div className="h-14 shrink-0 md:hidden" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
