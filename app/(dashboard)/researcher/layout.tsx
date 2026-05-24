import { Sidebar } from '@/components/layout/sidebar'
import { Watermark } from '@/components/layout/watermark'
import { createClient } from '@/lib/supabase/server'

export default async function ResearcherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let credits = 0
  let email = ''
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      email = user.email ?? ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('researcher_profiles')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle()
      credits = data?.credits ?? 0
    }
  } catch {
    credits = 0
  }

  return (
    <div className="flex h-screen overflow-hidden select-none" data-protect>
      <Sidebar role="researcher" credits={credits} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Spacer for mobile fixed top bar (h-14). Hidden on md+ where sidebar is static. */}
        <div className="h-14 shrink-0 md:hidden" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      {email && <Watermark email={email} />}
    </div>
  )
}
