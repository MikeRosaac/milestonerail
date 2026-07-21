import { useState } from 'react'
import {
  Banknote,
  BookOpenCheck,
  ChevronDown,
  CircleGauge,
  ClipboardCheck,
  FileClock,
  LogOut,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useRealtimeSync } from '../hooks/use-app-data'
import { cn, titleCase } from '../lib/utils'
import type { Role } from '../types'
import { Avatar } from './ui'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  roles: Role[]
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    path: '/app/overview',
    icon: CircleGauge,
    roles: ['mentor', 'finance', 'admin'],
  },
  {
    label: 'Milestones',
    path: '/app/milestones',
    icon: BookOpenCheck,
    roles: ['learner', 'admin'],
  },
  {
    label: 'Reviews',
    path: '/app/reviews',
    icon: ClipboardCheck,
    roles: ['mentor', 'admin'],
  },
  {
    label: 'Payouts',
    path: '/app/payouts',
    icon: Banknote,
    roles: ['finance', 'admin'],
  },
  {
    label: 'Audit',
    path: '/app/audit',
    icon: FileClock,
    roles: ['learner', 'mentor', 'finance', 'admin'],
  },
  {
    label: 'Workflow',
    path: '/app/workflow',
    icon: Workflow,
    roles: ['admin'],
  },
]

const roles: Role[] = ['learner', 'mentor', 'finance', 'admin']

function roleDestination(role: Role) {
  if (role === 'learner') return '/app/milestones'
  if (role === 'mentor') return '/app/reviews'
  if (role === 'finance') return '/app/payouts'
  return '/app/overview'
}

function RailLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-slate-950">
        <span className="absolute inset-x-1.5 top-2 h-0.5 rounded-full bg-indigo-500" />
        <span className="absolute inset-x-2.5 top-4 h-0.5 rounded-full bg-current opacity-75" />
        <span className="absolute inset-x-3.5 top-6 h-0.5 rounded-full bg-current opacity-40" />
      </span>
      {!compact ? (
        <span className="text-[15px] font-extrabold tracking-tight text-white">MilestoneRail</span>
      ) : null}
    </span>
  )
}

function TestModePill({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.09em] text-amber-200">
      <span className="size-1.5 rounded-full bg-amber-300" />
      {compact ? 'Test' : 'Paystack test · No real money'}
    </span>
  )
}

export function AppShell() {
  useRealtimeSync()
  const { session, isDemo, quickSignIn, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)

  if (!session) return null

  const visibleItems = navItems.filter((item) => item.roles.includes(session.user.role))
  const currentItem = visibleItems.find((item) => location.pathname.startsWith(item.path))

  function switchRole(role: Role) {
    if (role === session?.user.role) return
    quickSignIn(role)
    setProfileOpen(false)
    navigate(roleDestination(role), { replace: true })
  }

  function handleSignOut() {
    signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 px-4 py-5 text-white lg:flex">
        <div className="px-2">
          <RailLogo />
        </div>

        <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.045] p-3.5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-500/15 text-indigo-200">
              <ShieldCheck className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">Build Africa</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">Cohort 07 · Operations</p>
            </div>
          </div>
        </div>

        <nav className="mt-7 flex-1" aria-label="Workspace navigation">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </p>
          <div className="mt-2 space-y-1">
            {visibleItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:bg-white/6 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'size-4.5',
                        isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-300',
                      )}
                      aria-hidden
                    />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="space-y-3">
          {isDemo ? (
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-3">
              <TestModePill />
              <p className="mt-2 text-[11px] leading-4 text-slate-400">
                Local state persists while you switch roles in this tab.
              </p>
            </div>
          ) : null}
          <div className="flex items-center gap-3 border-t border-white/8 px-1 pt-4">
            <Avatar
              name={session.user.name}
              size="sm"
              className="bg-indigo-500/20 text-indigo-100 ring-slate-950"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{session.user.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{titleCase(session.user.role)}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Sign out"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f6f7fb]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <RailLogo compact />
              </div>
              <div className="hidden h-5 w-px bg-slate-200 sm:block lg:hidden" />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900">
                  {currentItem?.label || 'Workspace'}
                </p>
                <p className="hidden truncate text-[11px] font-medium text-slate-400 sm:block">
                  Build Africa · Digital Product Fellowship
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDemo ? (
                <div className="hidden sm:block">
                  <TestModePill compact />
                </div>
              ) : null}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <Avatar name={session.user.name} size="sm" />
                  <span className="hidden max-w-32 truncate text-xs font-bold text-slate-700 sm:block">
                    {titleCase(session.user.role)}
                  </span>
                  <ChevronDown className="size-3.5 text-slate-400" aria-hidden />
                </button>

                {profileOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setProfileOpen(false)}
                      aria-label="Close account menu"
                    />
                    <div
                      className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.28)]"
                      role="menu"
                    >
                      <div className="border-b border-slate-100 px-3 py-3">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {session.user.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {session.user.email}
                        </p>
                      </div>
                      {isDemo ? (
                        <div className="py-2">
                          <p className="px-3 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                            Switch local demo role
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {roles.map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => switchRole(role)}
                                className={cn(
                                  'rounded-lg px-3 py-2 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                                  role === session.user.role
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                                )}
                                role="menuitem"
                              >
                                {titleCase(role)}
                              </button>
                            ))}
                          </div>
                          <p className="mx-2 mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-semibold leading-4 text-amber-800">
                            Paystack test mode. No real money.
                          </p>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        role="menuitem"
                      >
                        <LogOut className="size-4" aria-hidden />
                        Sign out
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl lg:hidden"
        aria-label="Mobile workspace navigation"
      >
        <div className="mx-auto flex max-w-xl items-start justify-around overflow-x-auto">
          {visibleItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400',
                )
              }
            >
              <Icon className="size-4.5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
