import { useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Droplets,
  Bell,
  LineChart,
  Settings,
  Users,
  Fuel,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Radio,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { getWells } from '@/services/api'
import { useReducedMotion } from '@/lib/useReducedMotion'

// ===========================================================================
// AppLayout — shell for all /app routes.
//   • Fixed, collapsible sidebar with role-aware nav
//   • Top bar: well selector, connection status, user menu
//   • Animated content area (AnimatePresence fade + slide-up)
// ===========================================================================

type IconType = typeof LayoutDashboard

interface NavItem {
  to: string
  label: string
  icon: IconType
  /** exact match only (for the index route) */
  end?: boolean
  /** highlight when the path starts with this prefix */
  matchPrefix?: string
}

const NAV: NavItem[] = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  {
    to: '/app/well/well-001',
    label: 'Wells',
    icon: Droplets,
    matchPrefix: '/app/well',
  },
  { to: '/app/alerts', label: 'Alerts', icon: Bell },
  { to: '/app/analytics', label: 'Analytics', icon: LineChart },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/app/admin/users', label: 'Manage Users', icon: Users },
  { to: '/app/admin/wells', label: 'Manage Wells', icon: Droplets },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = useAuthStore((s) => s.role)
  const location = useLocation()
  const reduced = useReducedMotion()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        isAdmin={role === 'admin'}
      />

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAdmin={role === 'admin'}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({
  collapsed,
  onToggle,
  isAdmin,
}: {
  collapsed: boolean
  onToggle: () => void
  isAdmin: boolean
}) {
  return (
    <aside
      className={[
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex',
        collapsed ? 'w-[76px]' : 'w-60',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Fuel className="h-6 w-6 shrink-0 text-primary" />
        {!collapsed && (
          <span className="truncate text-lg font-bold tracking-tight">
            PetroSense
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV.map((item) => (
          <SideLink key={item.label} item={item} collapsed={collapsed} />
        ))}

        {isAdmin && (
          <>
            <div
              className={[
                'mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted',
                collapsed ? 'text-center' : '',
              ].join(' ')}
            >
              {collapsed ? '•••' : 'Admin'}
            </div>
            {ADMIN_NAV.map((item) => (
              <SideLink key={item.label} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="m-3 flex items-center justify-center gap-2 rounded-input border border-border py-2 text-sm text-muted transition-colors hover:bg-bg hover:text-text"
      >
        <ChevronLeft
          className={[
            'h-4 w-4 transition-transform',
            collapsed ? 'rotate-180' : '',
          ].join(' ')}
        />
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  )
}

function SideLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const location = useLocation()
  const { icon: Icon, to, label, end, matchPrefix } = item

  const isActive = matchPrefix
    ? location.pathname.startsWith(matchPrefix)
    : end
      ? location.pathname === to
      : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={[
        'group relative flex items-center gap-3 rounded-input px-3 py-2 text-sm transition-colors',
        collapsed ? 'justify-center' : '',
        isActive ? 'bg-bg text-text' : 'text-muted hover:bg-bg hover:text-text',
      ].join(' ')}
    >
      {/* active accent bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
      )}
      <Icon
        className={[
          'h-[18px] w-[18px] shrink-0',
          isActive ? 'text-primary' : '',
        ].join(' ')}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

// ---------------------------------------------------------------------------
// Mobile drawer — slide-in nav for < md screens (the desktop sidebar is
// hidden there). Same role-aware nav; closes on backdrop click, Escape, or
// navigating.
// ---------------------------------------------------------------------------

function MobileDrawer({
  open,
  onClose,
  isAdmin,
}: {
  open: boolean
  onClose: () => void
  isAdmin: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-surface"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <Fuel className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold tracking-tight">
                  PetroSense
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close navigation"
                className="text-muted transition-colors hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {NAV.map((item) => (
                <SideLink
                  key={item.label}
                  item={item}
                  collapsed={false}
                  onNavigate={onClose}
                />
              ))}
              {isAdmin && (
                <>
                  <div className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Admin
                  </div>
                  {ADMIN_NAV.map((item) => (
                    <SideLink
                      key={item.label}
                      item={item}
                      collapsed={false}
                      onNavigate={onClose}
                    />
                  ))}
                </>
              )}
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

function TopBar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, role, logout } = useAuthStore()
  const [userOpen, setUserOpen] = useState(false)

  const { data: wells } = useQuery({
    queryKey: ['wells'],
    queryFn: getWells,
  })

  // Reflect the currently open well in the selector, if any.
  const currentWellId = location.pathname.startsWith('/app/well/')
    ? location.pathname.split('/app/well/')[1]
    : ''

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 backdrop-blur md:px-6">
      {/* Well selector */}
      <div className="flex items-center gap-2">
        {/* Mobile nav trigger */}
        <button
          onClick={onOpenMobile}
          aria-label="Open navigation"
          className="-ml-1 mr-1 rounded-input p-1.5 text-muted transition-colors hover:bg-bg hover:text-text md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden text-xs text-muted sm:inline">Well</span>
        <div className="relative">
          <select
            value={currentWellId}
            aria-label="Select a well to view"
            onChange={(e) => {
              if (e.target.value) navigate(`/app/well/${e.target.value}`)
            }}
            className="appearance-none rounded-input border border-border bg-bg py-1.5 pl-3 pr-8 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">Select a well…</option>
            {wells?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-xs text-muted sm:flex">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-normal opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-normal" />
          </span>
          <Radio className="h-3.5 w-3.5" />
          Live
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserOpen((o) => !o)}
            aria-label="User menu"
            aria-haspopup="menu"
            aria-expanded={userOpen}
            className="flex items-center gap-2 rounded-input border border-border bg-bg px-2 py-1.5 text-sm transition-colors hover:border-primary"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {initials(currentUser?.name)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[140px] truncate font-medium text-text">
                {currentUser?.name ?? 'Guest'}
              </span>
              <span className="block text-[11px] capitalize text-muted">
                {role ?? '—'}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>

          <AnimatePresence>
            {userOpen && (
              <>
                {/* click-away layer */}
                <button
                  className="fixed inset-0 z-10 cursor-default"
                  aria-hidden
                  onClick={() => setUserOpen(false)}
                  tabIndex={-1}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-card border border-border bg-surface shadow-xl"
                >
                  <div className="border-b border-border px-4 py-3">
                    <div className="truncate text-sm font-medium text-text">
                      {currentUser?.name ?? 'Guest'}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {currentUser?.email ?? ''}
                    </div>
                    <div className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium capitalize text-primary">
                      {role ?? '—'}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-bg hover:text-critical"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

function initials(name?: string): string {
  if (!name) return '·'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
