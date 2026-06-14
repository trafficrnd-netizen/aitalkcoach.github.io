import { Header, type HeaderUser } from '@/components/layout/header'
import { EarlyBirdBanner } from '@/components/early-bird-banner'
import { CopyProtect } from '@/components/layout/copy-protect'
import { BriefingTicker } from '@/components/briefing-ticker'
import { SiteFooter } from '@/components/layout/site-footer'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (pathname.startsWith('/medi')) {
    return <>{children}</>
  }

  let headerUser: HeaderUser | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const isSupplier = user.user_metadata?.user_type === 'supplier'
      headerUser = {
        email: user.email ?? '',
        dashboardPath: isSupplier ? '/supplier/board' : '/researcher/board',
        roleLabel: isSupplier ? '\uACF5\uAE09\uC790' : '\uC5F0\uAD6C\uC790',
      }
    }
  } catch {
    headerUser = null
  }

  return (
    <div className="flex min-h-screen flex-col select-none">
      <CopyProtect />
      <EarlyBirdBanner />
      <BriefingTicker />
      <Header user={headerUser} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
