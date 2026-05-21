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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth'

const researcherNav = [
  { href: '/researcher/board',         label: '게시판',      icon: LayoutGrid },
  { href: '/researcher',               label: '대시보드',    icon: LayoutDashboard },
  { href: '/researcher/request',       label: '견적 요청',   icon: FlaskConical },
  { href: '/researcher/requests',      label: '내 요청 목록', icon: FileText },
  { href: '/researcher/notifications', label: '알림',        icon: Bell },
  { href: '/researcher/settings',      label: '설정',        icon: Settings },
  { href: '/researcher/guide',         label: '사용 가이드', icon: BookOpen },
]

const supplierNav = [
  { href: '/supplier/board',       label: '게시판',      icon: LayoutGrid },
  { href: '/supplier',             label: '대시보드',    icon: LayoutDashboard },
  { href: '/supplier/marketplace', label: '입찰 광장',   icon: Store },
  { href: '/supplier/bids',        label: '내 입찰 현황', icon: ClipboardList },
  { href: '/supplier/ads/new',     label: '광고 등록',   icon: Megaphone },
  { href: '/supplier/stats',       label: '통계',        icon: BarChart3 },
  { href: '/supplier/billing',     label: '구독 관리',   icon: CreditCard },
  { href: '/supplier/settings',    label: '설정',        icon: Settings },
  { href: '/supplier/guide',       label: '사용 가이드', icon: BookOpen },
]

interface SidebarProps {
  role: 'researcher' | 'supplier'
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = role === 'researcher' ? researcherNav : supplierNav

  // 라우트 변경 시 드로어 자동 닫기
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  function navLink(href: string, label: string, Icon: React.ElementType) {
    const isActive =
      href === `/${role}` || href === `/${role}/ads/new`
        ? pathname === href
        : pathname.startsWith(href)
    return (
      <li key={href}>
        <Link
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      </li>
    )
  }

  const logoutButton = (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      로그아웃
    </button>
  )

  const roleLabel = (
    <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      {role === 'researcher' ? '연구자 계정' : '공급자 계정'}
    </div>
  )

  return (
    <>
      {/* ── 모바일 상단 헤더 ────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <Link href="/" className="text-lg font-bold text-primary">
          BidVibe
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── 모바일 드로어 백드롭 ────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── 모바일 드로어 ────────────────────────────────────── */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-background transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link href="/" className="text-lg font-bold text-primary">
            BidVibe
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="메뉴 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => navLink(href, label, Icon))}
          </ul>
        </nav>
        <div className="border-t border-border p-3 space-y-1">
          {roleLabel}
          {logoutButton}
        </div>
      </div>

      {/* ── 데스크탑 사이드바 ─────────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-background">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link href="/" className="text-lg font-bold text-primary">
            BidVibe
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => navLink(href, label, Icon))}
          </ul>
        </nav>
        <div className="border-t border-border p-3 space-y-1">
          {roleLabel}
          {logoutButton}
        </div>
      </aside>
    </>
  )
}
