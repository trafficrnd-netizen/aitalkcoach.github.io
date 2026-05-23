import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'BidVibe — 연구실 시약·소모품·장비 역경매 B2B 조달 플랫폼',
  description: '요청하면 견적이 온다. 연구실 시약·소모품·장비 역경매 B2B 조달 플랫폼',
  openGraph: {
    title: 'BidVibe',
    description: '요청하면 견적이 온다. 연구실 시약·소모품·장비 역경매 B2B 조달 플랫폼',
    siteName: 'BidVibe',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={cn('font-sans', inter.variable)}>
      <body className="antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
