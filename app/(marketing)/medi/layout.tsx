import { MediHeader, type MediHeaderUser } from '@/components/layout/medi-header'
import { CopyProtect } from '@/components/layout/copy-protect'
import { createClient } from '@/lib/supabase/server'

// (marketing)/layout.tsx를 오버라이드 — EarlyBirdBanner, BriefingTicker, 메인 Header 제거
// /medi 하위 경로 전체에 적용

export default async function MediMarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let headerUser: MediHeaderUser | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const userType = user.user_metadata?.user_type as string | undefined

      if (userType === 'clinic') {
        headerUser = {
          email: user.email ?? '',
          dashboardPath: '/clinic',
          roleLabel: '의원',
        }
      } else if (userType === 'supplier') {
        // supplier 중 aesthetic verticals 가진 경우 → medi-supplier 대시보드
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sp } = await (supabase as any)
          .from('supplier_profiles')
          .select('verticals')
          .eq('user_id', user.id)
          .maybeSingle()

        const isAesthetic = (sp?.verticals as string[] | null)?.includes('aesthetic')
        headerUser = {
          email: user.email ?? '',
          dashboardPath: isAesthetic ? '/medi-supplier' : '/supplier',
          roleLabel: isAesthetic ? '공급사 (Medi)' : '공급사',
        }
      }
    }
  } catch {
    headerUser = null
  }

  return (
    <div className="medi-theme flex min-h-screen flex-col select-none">
      <CopyProtect />
      <MediHeader user={headerUser} />
      <main className="flex-1">{children}</main>

      {/* 심플 Medi 푸터 */}
      <footer className="border-t border-border py-6">
        <div className="container flex flex-col items-center gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} BidMedi — 에스테틱 소모품 비공개 역경매 플랫폼</span>
          <div className="flex gap-4">
            <a href="/terms" className="hover:text-foreground transition-colors">이용약관</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</a>
            <a href="/medi" className="hover:text-foreground transition-colors">BidMedi 홈</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
