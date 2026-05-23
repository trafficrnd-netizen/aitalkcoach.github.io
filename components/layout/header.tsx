'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">BidVibe</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              이용 방법
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              요금제
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            로그인
          </Link>
          <Link href="/signup/researcher" className={buttonVariants({ size: 'sm' })}>
            견적 요청하기
          </Link>
          <Link href="/signup/supplier" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            공급자 등록
          </Link>
        </div>
      </div>
    </header>
  )
}
