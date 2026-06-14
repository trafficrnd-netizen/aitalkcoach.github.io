import type { Metadata } from 'next'
import { MediHeader, type MediHeaderUser } from '@/components/layout/medi-header'
import { CopyProtect } from '@/components/layout/copy-protect'
import { createClient } from '@/lib/supabase/server'

const MEDI_BASE = 'https://ai-traffic.kr/medi'
const MEDI_TITLE = 'BidMedi — 구매자·공급사 모두 편한 플랫폼 | 에스테틱 소모품 역경매'
const MEDI_DESC = '에스테틱 소모품 비공개 역경매. 구매자와 공급사 모두 편한 BidMedi — 수수료 없이, 원하는 공급사에게만 견적을 받으세요.'
const MEDI_OG = '/medi-og-image.png'

export const metadata: Metadata = {
  title: {
    default: MEDI_TITLE,
    template: '%s | BidMedi',
  },
  description: MEDI_DESC,
  keywords: ['에스테틱 소모품', '피부관리실 부자재', '의원 소모품 역경매', '모델링팩', '일회용 위생용품', 'BidMedi'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: MEDI_BASE,
    title: MEDI_TITLE,
    description: MEDI_DESC,
    siteName: 'BidMedi',
    images: [{ url: MEDI_OG, width: 1200, height: 630, alt: '구매자·공급사 모두 편한 플랫폼 — BidMedi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: MEDI_TITLE,
    description: MEDI_DESC,
    images: [MEDI_OG],
  },
  alternates: { canonical: MEDI_BASE },
}

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
