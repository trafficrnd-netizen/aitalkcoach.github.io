import { Sidebar } from '@/components/layout/sidebar'
import { Watermark } from '@/components/layout/watermark'
import { createClient } from '@/lib/supabase/server'

export default async function MediLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let email = ''
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) email = user.email ?? ''
  } catch { /* ignore */ }

  return (
    <div className="flex h-screen overflow-hidden select-none" data-protect>
      <Sidebar role="clinic" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-14 shrink-0 md:hidden" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      {email && <Watermark email={email} />}
    </div>
  )
}
