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
  Users,
  Gift,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth'
import { useT } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/language-toggle'

const researcherNav = [
  { href: '/researcher/board', key: 'sb.board', icon: LayoutGrid },
  { href: '/researcher', key: 'sb.dashboard', icon: LayoutDashboard },
  { href: '/researcher/request', key: 'sb.request', icon: FlaskConical },
  { href: '/researcher/requests', key: 'sb.myRequests', icon: FileText },
  { href: '/researcher/notifications', key: 'sb.notifications', icon: Bell },
  { href: '/researcher/invite', key: 'sb.invite', icon: UserPlus },
  { href: '/researcher/settings', key: 'sb.settings', icon: Settings },
  { href: '/researcher/guide', key: 'sb.guide', icon: BookOpen },
]

const supplierNav = [
  { href: '/supplier/board', key: 'sb.board', icon: LayoutGrid },
  { href: '/supplier', key: 'sb.dashboard', icon: LayoutDashboard },
  { href: '/supplier/marketplace', key: 'sb.marketplace', icon: Store },
  { href: '/supplier/bids', key: 'sb.myBids', icon: ClipboardList },
  { href: '/supplier/customers', key: 'sb.customers', icon: Users },
  { href: '/supplier/ads/new', key: 'sb.newAd', icon: Megaphone },
  { href: '/supplier/stats', key: 'sb.stats', icon: BarChart3 },
  { href: '/supplier/billing', key: 'sb.billing', icon: CreditCard },
  { href: '/supplier/invite', key: 'sb.invite', icon: UserPlus },
  { href: '/supplier/settings', key: 'sb.settings', icon: Settings },
  { href: '/supplier/guide', key: 'sb.guide', icon: BookOpen },
]

const clinicNav = [
  { href: '/clinic', key: 'sb.medi.dashboard', icon: LayoutDashboard },
  { href: '/clinic/request', key: 'sb.medi.request', icon: FlaskConical },
  { href: '/clinic/requests', key: 'sb.medi.myRequests', icon: FileText },
  { href: '/clinic/settings', key: 'sb.settings', icon: Settings },
]

const mediSupplierNav = [
  { href: '/medi-supplier', key: 'sb.medi.dashboard', icon: LayoutDashboard },
  { href: '/medi-supplier/marketplace', key: 'sb.medi.marketplace', icon: Store },
  { href: '/medi-supplier/bids', key: 'sb.medi.myBids', icon: ClipboardList },
  { href: '/medi-supplier/settings', key: 'sb.settings', icon: Settings },
]

interface SidebarProps {
  role: 'researcher' | 'supplier' | 'clinic' | 'medi-supplier'
  credits?: number
}

export function Sidebar({ role, credits = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useT()
  const isMediRole = role === 'clinic' || role === 'medi-supplier'
  const navItems =
    role === 'researcher' ? researcherNav
    : role === 'clinic' ? clinicNav
    : role === 'medi-supplier' ? mediSupplierNav
    : supplierNav
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setPendingHref(null)
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await logout()
    router.push(isMediRole ? '/medi/login' : '/login')
  }

  const creditsHref = isMediRole ? '/medi' : `/${role}/credits`

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="BidVibe" className="h-7 w-auto" />
        </Link>
        <button
          className="md:hidden rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => setMobileOpen(false)}
          aria-label={t('sb.closeMenu')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map(({ href, key, icon: Icon }) => {
            const label = t(key)
            const rootHrefs = [`/${role}`, '/clinic', '/medi-supplier', `/${role}/ads/new`]
            const isActive = rootHrefs.includes(href)
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

      <div className="border-t border-border p-3 space-y-2">
        {isMediRole ? (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                <Gift className="h-4 w-4 text-emerald-600" />
              </span>
              <div>
                <p className="text-[11px] leading-tight text-emerald-700 font-semibold">{t('sb.medi.freePlan')}</p>
                <p className="text-[10px] leading-tight text-emerald-600">{t('sb.medi.freeHint')}</p>
              </div>
            </div>
          </div>
        ) : (
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
                  <p className="text-[11px] leading-tight text-muted-foreground">{t('sb.myCredits')}</p>
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
              {t('sb.creditsHint')}
            </p>
          </Link>
        )}

        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span>
            {role === 'researcher' ? t('sb.researcherAccount')
              : role === 'clinic' ? t('sb.medi.clinicAccount')
              : role === 'medi-supplier' ? t('sb.medi.supplierAccount')
              : t('sb.supplierAccount')}
          </span>
          <LanguageToggle variant="inline" />
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {t('common.logout')}
        </button>
      </div>
    </>
  )

  return (
    <>
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t('sb.openMenu')}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="BidVibe" className="h-7 w-auto" />
        </Link>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

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
