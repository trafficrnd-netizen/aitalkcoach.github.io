import { Header, type HeaderUser } from '@/components/layout/header'
import { EarlyBirdBanner } from '@/components/early-bird-banner'
import { CopyProtect } from '@/components/layout/copy-protect'
import { BriefingTicker } from '@/components/briefing-ticker'
import { SiteFooter } from '@/components/layout/site-footer'
import { createClient } from '@/lib/supabase/server'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 로그인 상태를 조회하여 헤더에 전달
  let headerUser: HeaderUser | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const isSupplier = user.user_metadata?.user_type === 'supplier'
      headerUser = {
        email: user.email ?? '',
        dashboardPath: isSupplier ? '/supplier/board' : '/researcher/board',
        roleLabel: isSupplier ? '공급자' : '연구자',
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
