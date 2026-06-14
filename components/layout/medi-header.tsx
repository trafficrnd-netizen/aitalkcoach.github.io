'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, LogOut, Sparkles } from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { LanguageToggle } from '@/components/language-toggle'

export interface MediHeaderUser {
  email: string
  dashboardPath: '/clinic' | '/medi-supplier' | '/supplier'
  roleLabel: string
}

export function MediHeader({ user }: { user?: MediHeaderUser | null }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    router.push('/medi')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2 px-4">

        {/* 로고 — /medi 복귀 */}
        <Link href="/medi" className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <span className="font-black text-base tracking-tight">
            BidVibe <span className="text-violet-400">Medi</span>
          </span>
          <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
            프로모션 기간 전액무료
          </span>
        </Link>

        {/* 우측 액션 */}
        <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
          <LanguageToggle variant="compact" />

          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground lg:inline">
                {user.roleLabel} · <span className="font-medium text-foreground">{user.email}</span>
              </span>
              <Link
                href={user.dashboardPath}
                className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">내 대시보드</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{loggingOut ? '로그아웃 중…' : '로그아웃'}</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/medi/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
              >
                로그인
              </Link>
              <Link
                href="/signup/clinic"
                className={buttonVariants({ size: 'sm' })}
              >
                의원 가입
              </Link>
              <Link
                href="/signup/medi-supplier"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden md:inline-flex')}
              >
                공급사 가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
