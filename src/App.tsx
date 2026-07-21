import { lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Banknote,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Workflow,
} from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { Button, Notice } from './components/ui'
import { useAuth } from './auth/auth-context'
import type { Role } from './types'

const AuditPage = lazy(() =>
  import('./pages/audit').then((module) => ({ default: module.AuditPage })),
)
const MilestonesPage = lazy(() =>
  import('./pages/milestones').then((module) => ({ default: module.MilestonesPage })),
)
const OverviewPage = lazy(() =>
  import('./pages/overview').then((module) => ({ default: module.OverviewPage })),
)
const PayoutsPage = lazy(() =>
  import('./pages/payouts').then((module) => ({ default: module.PayoutsPage })),
)
const ReviewsPage = lazy(() =>
  import('./pages/reviews').then((module) => ({ default: module.ReviewsPage })),
)
const WorkflowPage = lazy(() =>
  import('./pages/workflow').then((module) => ({ default: module.WorkflowPage })),
)

function roleHome(role: Role) {
  if (role === 'learner') return '/app/milestones'
  if (role === 'mentor') return '/app/reviews'
  if (role === 'finance') return '/app/payouts'
  return '/app/overview'
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`relative grid size-9 place-items-center overflow-hidden rounded-xl ${
          light ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
        }`}
      >
        <span className="absolute inset-x-1.5 top-2 h-0.5 rounded-full bg-indigo-400" />
        <span className="absolute inset-x-2.5 top-4 h-0.5 rounded-full bg-current opacity-75" />
        <span className="absolute inset-x-3.5 top-6 h-0.5 rounded-full bg-current opacity-40" />
      </span>
      <span className={`text-[15px] font-extrabold tracking-tight ${light ? 'text-white' : ''}`}>
        MilestoneRail
      </span>
    </span>
  )
}

const demoRoles: Array<{
  role: Role
  label: string
  description: string
  icon: typeof BookOpenCheck
  accent: string
}> = [
  {
    role: 'learner',
    label: 'Learner',
    description: 'Submit the API capstone',
    icon: BookOpenCheck,
    accent: 'bg-blue-50 text-blue-700',
  },
  {
    role: 'mentor',
    label: 'Mentor',
    description: 'Review milestone evidence',
    icon: UserRoundCheck,
    accent: 'bg-violet-50 text-violet-700',
  },
  {
    role: 'finance',
    label: 'Finance',
    description: 'Authorize a test payout',
    icon: CircleDollarSign,
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Configure the approval rail',
    icon: Workflow,
    accent: 'bg-emerald-50 text-emerald-700',
  },
]

function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-950">
      <div className="relative isolate">
        <div className="landing-glow" aria-hidden />
        <nav
          className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10"
          aria-label="Public navigation"
        >
          <Brand />
          <div className="flex items-center gap-2">
            <Link
              to="/sign-in"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-950 sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Open local demo
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </nav>

        <section className="relative z-10 mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur">
              <Sparkles className="size-3.5" aria-hidden />
              Evidence-to-payout operations, on one rail
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Every milestone.
              <span className="block bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Clearly earned.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              MilestoneRail gives program teams one trusted operating view for learner evidence,
              mentor approval, budget checks, and auditable stipend delivery.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/sign-in"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-xl shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500"
              >
                Explore the judge demo
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="#workflow"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
              >
                See the operating rail
                <ChevronRight className="size-4" aria-hidden />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
              {['Role-based controls', 'Human approval gates', 'Signed event trail'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:justify-self-end">
            <div
              className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-indigo-300/30 via-cyan-200/20 to-transparent blur-3xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-slate-950 p-2.5 shadow-[0_35px_90px_-30px_rgba(15,23,42,0.55)]">
              <div className="rounded-[1.35rem] bg-[#fbfcff] p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                      Live workflow preview
                    </p>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                      API capstone · Amara
                    </h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
                    Local demo
                  </span>
                </div>

                <div id="workflow" className="mt-7 space-y-1">
                  {[
                    ['Evidence submitted', 'Learner', 'complete'],
                    ['Mentor review', '24h SLA', 'current'],
                    ['Finance approval', 'Budget gate', 'upcoming'],
                    ['Paystack test payout', 'No real money', 'upcoming'],
                    ['Audit receipt', 'Signed webhook', 'upcoming'],
                  ].map(([label, meta, state], index) => (
                    <div key={label} className="grid grid-cols-[28px_1fr_auto] items-center gap-3">
                      <div className="relative grid h-12 place-items-center">
                        {index > 0 ? (
                          <span className="absolute -top-2 h-4 w-px bg-slate-200" />
                        ) : null}
                        {index < 4 ? (
                          <span className="absolute -bottom-2 h-4 w-px bg-slate-200" />
                        ) : null}
                        <span
                          className={`relative z-10 grid size-7 place-items-center rounded-full border-2 ${
                            state === 'complete'
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : state === 'current'
                                ? 'border-indigo-600 bg-white text-indigo-600 shadow-[0_0_0_5px_rgba(79,70,229,0.1)]'
                                : 'border-slate-200 bg-white text-slate-300'
                          }`}
                        >
                          {state === 'complete' ? (
                            <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          ) : (
                            <span className="size-1.5 rounded-full bg-current" />
                          )}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{label}</p>
                      <p className="text-right text-xs font-semibold text-slate-400">{meta}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-400">Eligible amount</p>
                    <p className="mt-1 text-xl font-black tracking-tight">NGN 45,000</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-400">Control</p>
                    <p className="mt-1 text-sm font-extrabold text-indigo-700">
                      2 approvals required
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">
                  Demo data only · Paystack test mode · No real money
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-slate-100 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          {[
            {
              icon: Layers3,
              title: 'One operating record',
              text: 'Evidence, decisions, payout state, and event history stay attached to the milestone.',
            },
            {
              icon: ShieldCheck,
              title: 'Controls people can see',
              text: 'Roles, SLAs, and approval gates are explicit before any payout is authorized.',
            },
            {
              icon: Banknote,
              title: 'Provider-aware delivery',
              text: 'Test payout status updates from a simulated signed Paystack webhook in this demo.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="px-1 py-10 md:px-8 md:py-12 first:md:pl-0 last:md:pr-0">
              <span className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <h2 className="mt-5 text-base font-extrabold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="bg-slate-950 px-5 py-8 text-slate-400 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Brand light />
          <p className="text-xs">
            Judge-facing local demo. Displayed outcomes are illustrative, not production impact.
          </p>
        </div>
      </footer>
    </main>
  )
}

function SignInPage() {
  const { isAuthenticated, isDemo, quickSignIn, signIn, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('amara@demo.milestonerail.app')
  const [password, setPassword] = useState('demo2026')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated && session) {
    return <Navigate to={roleHome(session.user.role)} replace />
  }

  const destination =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      navigate(destination || '/app', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleQuickSignIn(role: Role) {
    setError('')
    try {
      quickSignIn(role)
      navigate(roleHome(role), { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open the demo account.')
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="auth-orb" aria-hidden />
        <div className="relative z-10">
          <Link to="/" aria-label="MilestoneRail home">
            <Brand light />
          </Link>
        </div>
        <div className="relative z-10 max-w-lg pb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-indigo-200">
            <LockKeyhole className="size-3.5" aria-hidden />
            Role-aware operations
          </span>
          <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-[-0.045em]">
            Move earned milestones forward, with every decision visible.
          </h1>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ['01', 'Submit'],
              ['02', 'Approve'],
              ['03', 'Pay · test'],
            ].map(([number, label]) => (
              <div key={number} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black text-indigo-300">{number}</p>
                <p className="mt-5 text-sm font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs leading-5 text-slate-500">
          Local demo environment · Paystack test mode · No real money moves
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Link to="/">
              <Brand />
            </Link>
            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-slate-950">
              Back home
            </Link>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Secure workspace
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              Welcome to the rail
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in with your program account or open a local demo role.
            </p>
          </div>

          {error ? (
            <div className="mt-6" role="alert">
              <Notice tone="danger" title="Could not sign in">
                {error}
              </Notice>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Email address</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field"
                placeholder="you@organization.org"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-4 text-sm font-bold text-slate-700">
                Password
                {isDemo ? (
                  <span className="font-semibold text-slate-400">Demo: demo2026</span>
                ) : null}
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field"
              />
            </label>
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Sign in to workspace
              {!isSubmitting ? <ArrowRight className="size-4" aria-hidden /> : null}
            </Button>
          </form>

          {isDemo ? (
            <>
              <div className="my-8 flex items-center gap-4" aria-hidden>
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  One-click local demo
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {demoRoles.map(({ role, label, description, icon: Icon, accent }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickSignIn(role)}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label={`Continue as demo ${label}`}
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${accent}`}
                    >
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-slate-900">{label}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {description}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
              <p className="mt-5 text-center text-xs font-semibold text-amber-700">
                Paystack test only. No real money is sent in this demo.
              </p>
            </>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function ProtectedApp() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }
  return <AppShell />
}

function AppIndex() {
  const { session } = useAuth()
  return <Navigate to={session ? roleHome(session.user.role) : '/sign-in'} replace />
}

function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/sign-in" replace />
  if (!roles.includes(session.user.role)) {
    return <Navigate to={roleHome(session.user.role)} replace />
  }
  return children
}

function App() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f6f7fb]">
          <div className="text-center">
            <Brand />
            <p className="mt-4 text-xs font-semibold text-slate-400">Loading workspace…</p>
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/app" element={<ProtectedApp />}>
          <Route index element={<AppIndex />} />
          <Route
            path="overview"
            element={
              <RoleGuard roles={['mentor', 'finance', 'admin']}>
                <OverviewPage />
              </RoleGuard>
            }
          />
          <Route
            path="milestones"
            element={
              <RoleGuard roles={['learner', 'admin']}>
                <MilestonesPage />
              </RoleGuard>
            }
          />
          <Route
            path="reviews"
            element={
              <RoleGuard roles={['mentor', 'admin']}>
                <ReviewsPage />
              </RoleGuard>
            }
          />
          <Route
            path="payouts"
            element={
              <RoleGuard roles={['finance', 'admin']}>
                <PayoutsPage />
              </RoleGuard>
            }
          />
          <Route path="audit" element={<AuditPage />} />
          <Route
            path="workflow"
            element={
              <RoleGuard roles={['admin']}>
                <WorkflowPage />
              </RoleGuard>
            }
          />
          <Route path="*" element={<AppIndex />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
