'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { logout } from '@/lib/actions/auth'

export interface HeaderUser {
  email: string
  dashboardPath: string
  roleLabel: string
}

export function Header({ user }: { user?: HeaderUser | null }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    router.push('/')
    router.refresh()
  }

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
          {user ? (
            <>
              {/* 로그인 상태 표시 */}
              <span className="hidden items-center gap-1.5 sm:flex">
                <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {user.roleLabel} · <span className="font-medium text-foreground">{user.email}</span>
                </span>
              </span>
              <Link
                href={user.dashboardPath}
                className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
              >
                <LayoutDashboard className="h-4 w-4" />
                내 대시보드
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? '로그아웃 중…' : '로그아웃'}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                로그인
              </Link>
              <Link href="/signup/researcher" className={buttonVariants({ size: 'sm' })}>
                견적 요청하기
              </Link>
              <Link href="/signup/supplier" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                공급자 등록
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
