import Link from 'next/link'
import { LanguageToggle } from '@/components/language-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      {/* 상단 우측 언어 토글 */}
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>

      <Link href="/" className="mb-8 text-2xl font-bold text-primary">
        BidVibe
      </Link>
      {children}
    </div>
  )
}
