'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { LanguageToggle } from '@/components/language-toggle'
import { useT } from '@/lib/i18n/context'

export interface HeaderUser {
  email: string
  dashboardPath: string
  roleLabel: string
}

export function Header({ user }: { user?: HeaderUser | null }) {
  const router = useRouter()
  const t = useT()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">BidVibe</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.howItWorks')}
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.pricing')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 sm:gap-3">
          {/* 모바일: 간결 토글 / 데스크톱: 풀 토글 */}
          <span className="inline-flex sm:hidden"><LanguageToggle variant="compact" /></span>
          <span className="hidden sm:inline-flex"><LanguageToggle /></span>
          {user ? (
            <>
              {/* 로그인 상태 표시 — 데스크톱만 */}
              <span className="hidden items-center gap-1.5 lg:flex">
                <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {user.dashboardPath.includes('/supplier') ? t('nav.roleSupplier') : t('nav.roleResearcher')} ·{' '}
                  <span className="font-medium text-foreground">{user.email}</span>
                </span>
              </span>
              <Link
                href={user.dashboardPath}
                className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.myDashboard')}</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                aria-label={t('common.logout')}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{loggingOut ? t('nav.loggingOut') : t('common.logout')}</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>
                {t('common.login')}
              </Link>
              <Link href="/signup/researcher" className={buttonVariants({ size: 'sm' })}>
                {t('nav.requestQuote')}
              </Link>
              <Link href="/signup/supplier" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden md:inline-flex')}>
                {t('nav.registerSupplier')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
