import { Header, type HeaderUser } from '@/components/layout/header'
import { EarlyBirdBanner } from '@/components/early-bird-banner'
import { CopyProtect } from '@/components/layout/copy-protect'
import { BriefingTicker } from '@/components/briefing-ticker'
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
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center gap-2 text-sm text-muted-foreground md:flex-row md:justify-between">
          <p>© 2026 BidVibe. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/terms" className="hover:text-foreground transition-colors">
              이용약관
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              개인정보처리방침
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
