'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  Bell,
  Settings,
  Store,
  ClipboardList,
  BarChart3,
  CreditCard,
  BookOpen,
  LayoutGrid,
  Megaphone,
  LogOut,
  Menu,
  X,
  Coins,
  ChevronRight,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth'

const researcherNav = [
  { href: '/researcher/board', label: '게시판', icon: LayoutGrid },
  { href: '/researcher', label: '대시보드', icon: LayoutDashboard },
  { href: '/researcher/request', label: '견적 요청', icon: FlaskConical },
  { href: '/researcher/requests', label: '내 요청 목록', icon: FileText },
  { href: '/researcher/notifications', label: '알림', icon: Bell },
  { href: '/researcher/invite', label: '친구 초대', icon: UserPlus },
  { href: '/researcher/settings', label: '설정', icon: Settings },
  { href: '/researcher/guide', label: '사용 가이드', icon: BookOpen },
]

const supplierNav = [
  { href: '/supplier/board', label: '게시판', icon: LayoutGrid },
  { href: '/supplier', label: '대시보드', icon: LayoutDashboard },
  { href: '/supplier/marketplace', label: '입찰 광장', icon: Store },
  { href: '/supplier/bids', label: '내 입찰 현황', icon: ClipboardList },
  { href: '/supplier/ads/new', label: '광고 등록', icon: Megaphone },
  { href: '/supplier/stats', label: '통계', icon: BarChart3 },
  { href: '/supplier/billing', label: '구독 관리', icon: CreditCard },
  { href: '/supplier/invite', label: '친구 초대', icon: UserPlus },
  { href: '/supplier/settings', label: '설정', icon: Settings },
  { href: '/supplier/guide', label: '사용 가이드', icon: BookOpen },
]

interface SidebarProps {
  role: 'researcher' | 'supplier'
  credits?: number
}

export function Sidebar({ role, credits = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = role === 'researcher' ? researcherNav : supplierNav
  const [mobileOpen, setMobileOpen] = useState(false)
  // 클릭 즉시 시각 피드백 — 이동 중인 경로 추적
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // 경로가 실제로 바뀌면 pending 해제
  useEffect(() => {
    setPendingHref(null)
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const creditsHref = `/${role}/credits`

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/" className="text-lg font-bold text-primary">
          BidVibe
        </Link>
        <button
          className="md:hidden rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => setMobileOpen(false)}
          aria-label="메뉴 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === `/${role}` || href === `/${role}/ads/new`
                ? pathname === href
                : pathname.startsWith(href)
            const isPending = pendingHref === href && !isActive
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setPendingHref(href)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : isPending
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        {/* 크레딧 요약 위젯 */}
        <Link
          href={creditsHref}
          onClick={() => setPendingHref(creditsHref)}
          className={cn(
            'block rounded-lg border p-3 transition-colors',
            pathname.startsWith(creditsHref)
              ? 'border-accent bg-accent/10'
              : 'border-accent/40 bg-accent/5 hover:bg-accent/10'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20">
                <Coins className="h-4 w-4 text-accent-foreground" />
              </span>
              <div>
                <p className="text-[11px] leading-tight text-muted-foreground">내 크레딧</p>
                <p className="text-sm font-bold leading-tight text-foreground">
                  {credits.toLocaleString()} P
                </p>
              </div>
            </div>
            {pendingHref === creditsHref ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-accent-foreground/80">
            적립 방법을 확인하고 무료 견적 한도를 늘려보세요 →
          </p>
        </Link>

        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {role === 'researcher' ? '연구자 계정' : '공급자 계정'}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          로그아웃
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="text-lg font-bold text-primary">
          BidVibe
        </Link>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex w-56 shrink-0 flex-col border-r border-border bg-background',
          'md:static md:translate-x-0',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
