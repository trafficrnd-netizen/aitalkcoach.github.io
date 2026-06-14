import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { LanguageProvider } from '@/lib/i18n/context'
import type { Lang } from '@/lib/i18n/dictionary'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const BASE_URL = 'https://ai-traffic.kr'

const TITLE_KO = 'BidVibe — 연구자·공급사 매칭 플랫폼'
const TITLE_BILINGUAL = 'BidVibe — 요청하면 견적이 다~ 온다 | Researcher–Supplier Matching'
const DESC_BILINGUAL =
  '요청하면 견적이 다~ 온다. 연구자-공급사 매칭 플랫폼. 수수료 없는 비공개 역경매로 쉽게 해보세요. ' +
  '· Request it — quotes come pouring in. A researcher–supplier matching platform. Commission-free sealed-bid reverse auctions.'

const OG_IMAGE = '/og-image.jpg'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: TITLE_KO,
    template: '%s | BidVibe',
  },
  description: DESC_BILINGUAL,
  keywords: ['연구실 시약', '소모품 역경매', '실험실 장비 조달', 'B2B 조달', '시약 견적', '연구실 구매', 'BidVibe', 'ai-traffic', 'lab procurement', 'reverse auction', 'reagent quote'],
  authors: [{ name: 'BidVibe', url: BASE_URL }],
  creator: 'BidVibe',
  icons: {
    icon: [
      { url: '/favicon.ico',       sizes: '16x16 32x32 48x48' },
      { url: '/favicon.svg',       type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple:    [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    alternateLocale: ['en_US'],
    url: BASE_URL,
    title: TITLE_BILINGUAL,
    description: DESC_BILINGUAL,
    siteName: 'BidVibe',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: '요청하면 견적이 다~ 온다 — BidVibe' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE_BILINGUAL,
    description: DESC_BILINGUAL,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    other: {
      'naver-site-verification': 'NAVER_VERIFICATION_KEY_PLACEHOLDER',
    },
    google: 'GOOGLE_VERIFICATION_KEY_PLACEHOLDER',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieLang = cookies().get('bidvibe_lang')?.value
  const initialLang: Lang = cookieLang === 'en' ? 'en' : 'ko'

  return (
    <html lang={initialLang} className={cn('font-sans', inter.variable)}>
      <body className="antialiased">
        <LanguageProvider initialLang={initialLang}>
          {children}
          <Toaster richColors position="top-right" />
        </LanguageProvider>
      </body>
    </html>
  )
}
