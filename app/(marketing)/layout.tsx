import { Header } from '@/components/layout/header'
import { EarlyBirdBanner } from '@/components/early-bird-banner'
import { CopyProtect } from '@/components/layout/copy-protect'
import { BriefingTicker } from '@/components/briefing-ticker'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col select-none">
      <CopyProtect />
      <EarlyBirdBanner />
      <BriefingTicker />
      <Header />
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
