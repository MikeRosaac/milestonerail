import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Inbox,
  RefreshCw,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../auth/auth-context'
import { useDashboard, useWorkflow } from '../hooks/use-app-data'
import { formatDate, formatMoney, timeAgo } from '../lib/utils'
import type { SubmissionStatus } from '../types'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
} from '../components/ui'

function MetricCard({
  label,
  value,
  context,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  context: string
  icon: LucideIcon
  tone: string
}) {
  return (
    <Card className="group relative overflow-hidden p-5">
      <span
        className={`absolute -right-5 -top-5 size-24 rounded-full opacity-40 blur-2xl ${tone}`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
          <p className="mt-2 text-[11px] font-semibold text-slate-400">{context}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
          <Icon className="size-4.5" aria-hidden />
        </span>
      </div>
    </Card>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingBlock className="h-4 w-28" />
        <LoadingBlock className="h-9 w-72 max-w-full" />
        <LoadingBlock className="h-5 w-[30rem] max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <LoadingBlock key={index} className="h-36" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <LoadingBlock className="h-[370px]" />
        <LoadingBlock className="h-[370px]" />
      </div>
    </div>
  )
}

const attentionStatuses: SubmissionStatus[] = [
  'submitted',
  'changes_requested',
  'awaiting_finance',
  'failed',
]

export function OverviewPage() {
  const { session } = useAuth()
  const dashboardQuery = useDashboard()
  const workflowQuery = useWorkflow()

  if (dashboardQuery.isLoading) return <OverviewSkeleton />

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <Notice tone="danger" title="The operating overview could not load">
          <p>{dashboardQuery.error?.message || 'The dashboard request failed.'}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => void dashboardQuery.refetch()}
          >
            <RefreshCw className="size-4" aria-hidden />
            Try again
          </Button>
        </Notice>
      </div>
    )
  }

  const { cohort, summary, activity, submissions, events } = dashboardQuery.data
  const role = session?.user.role || 'admin'
  const attention = submissions
    .filter((submission) => {
      if (!attentionStatuses.includes(submission.status)) return false
      if (role === 'mentor') return submission.status === 'submitted'
      if (role === 'finance') {
        return ['awaiting_finance', 'processing', 'failed'].includes(submission.status)
      }
      return true
    })
    .slice(0, 5)

  const actionPath =
    role === 'mentor' ? '/app/reviews' : role === 'finance' ? '/app/payouts' : '/app/reviews'
  const workflow = workflowQuery.data || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization overview"
        title="Good afternoon, operations team"
        description={`${cohort.name} · ${cohort.location}. A live view of evidence, approvals, and demo payout state.`}
        actions={
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            Synced just now
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active learners"
          value={summary.activeLearners.toLocaleString()}
          context={`${cohort.programName} · current cohort`}
          icon={UsersRound}
          tone="bg-blue-50 text-blue-700"
        />
        <MetricCard
          label="Awaiting review"
          value={summary.awaitingReview.toLocaleString()}
          context={`${summary.averageReviewHours}h demo average review time`}
          icon={Clock3}
          tone="bg-violet-50 text-violet-700"
        />
        <MetricCard
          label="Finance ready"
          value={summary.awaitingFinance.toLocaleString()}
          context="Eligibility and mentor checks passed"
          icon={FileCheck2}
          tone="bg-amber-50 text-amber-700"
        />
        <MetricCard
          label="Paid state · demo"
          value={formatMoney(summary.paidThisMonth, cohort.currency)}
          context="Illustrative test records, not real transfers"
          icon={CircleDollarSign}
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.42fr_0.86fr]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div>
              <h2 className="font-extrabold tracking-tight text-slate-950">Seven-day activity</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Demo volume across submission, approval, and payout stages.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
              {[
                ['bg-indigo-500', 'Submitted'],
                ['bg-violet-500', 'Approved'],
                ['bg-emerald-500', 'Paid · test'],
              ].map(([color, label]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div
            className="h-[300px] px-1 pb-4 pt-6 sm:px-4"
            role="img"
            aria-label="Area chart of seven-day demo workflow activity"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="submittedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="paidFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 5" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  dy={9}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
                  contentStyle={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    boxShadow: '0 18px 45px -20px rgba(15,23,42,.3)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  name="Submitted"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#submittedFill)"
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  name="Approved"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="paid"
                  name="Paid · test"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#paidFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="font-extrabold tracking-tight text-slate-950">Needs attention</h2>
              <p className="mt-1 text-xs text-slate-500">Items ready for your role.</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="size-4" aria-hidden />
            </span>
          </div>
          {attention.length ? (
            <div className="divide-y divide-slate-100">
              {attention.map((submission) => (
                <Link
                  key={submission.id}
                  to={actionPath}
                  className="group flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
                >
                  <Avatar name={submission.learnerName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {submission.learnerName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {submission.milestoneTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge value={submission.status} />
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      Due {formatDate(submission.dueAt, 'd MMM')}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="size-4 text-slate-300 transition group-hover:text-indigo-500"
                    aria-hidden
                  />
                </Link>
              ))}
              <div className="px-5 py-4">
                <Link
                  to={actionPath}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-500"
                >
                  Open work queue
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Queue is clear"
              description="There are no actionable items for this role right now."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-extrabold tracking-tight text-slate-950">Workflow progress</h2>
              <p className="mt-1 text-xs text-slate-500">
                Current approval rail for {cohort.name}.
              </p>
            </div>
            {workflowQuery.isLoading ? (
              <span className="text-xs font-bold text-slate-400">Loading rail…</span>
            ) : (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">
                {workflow.length} stages
              </span>
            )}
          </div>
          <div className="px-5 py-4 sm:px-6">
            {workflowQuery.isError ? (
              <Notice tone="danger" title="Workflow unavailable">
                The approval rail could not be loaded.
              </Notice>
            ) : workflowQuery.isLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <LoadingBlock key={index} className="h-12" />
                ))}
              </div>
            ) : (
              <ol className="space-y-0">
                {workflow.map((step, index) => {
                  const count = submissions.filter(
                    (submission) => submission.currentStepId === step.id,
                  ).length
                  return (
                    <li key={step.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3">
                      <div className="relative grid h-14 place-items-center">
                        {index ? <span className="absolute -top-2 h-4 w-px bg-slate-200" /> : null}
                        {index < workflow.length - 1 ? (
                          <span className="absolute -bottom-2 h-4 w-px bg-slate-200" />
                        ) : null}
                        <span
                          className={`relative z-10 grid size-7 place-items-center rounded-full border-2 text-[10px] font-black ${
                            count
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 bg-white text-slate-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{step.label}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                          {step.slaHours ? `${step.slaHours}h SLA` : 'Automated handoff'} ·{' '}
                          {step.role}
                        </p>
                      </div>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-600">
                        {count}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-extrabold tracking-tight text-slate-950">
                Recent audit activity
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Human and provider events in one chronology.
              </p>
            </div>
            <Link
              to="/app/audit"
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-500"
            >
              View audit
            </Link>
          </div>
          {events.length ? (
            <div className="divide-y divide-slate-100 px-5 sm:px-6">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex gap-3 py-4">
                  <span
                    className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
                      event.eventType === 'payout_paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {event.eventType === 'payout_paid' ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : (
                      <Clock3 className="size-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-slate-800">{event.title}</p>
                      <time
                        className="shrink-0 text-[10px] font-semibold text-slate-400"
                        dateTime={event.createdAt}
                      >
                        {timeAgo(event.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">
                      {event.detail}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      {event.actorName} · {event.actorRole}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileCheck2}
              title="No events yet"
              description="Workflow decisions will appear here as they happen."
            />
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-4 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
            <Banknote className="size-4.5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Demo financial context</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Cohort budget {formatMoney(cohort.budget, cohort.currency)} · committed{' '}
              {formatMoney(cohort.committed, cohort.currency)} · ends {formatDate(cohort.endDate)}.
              All Paystack statuses here are test data; no real money moves.
            </p>
          </div>
        </div>
        <Badge value="active">Demo cohort</Badge>
      </Card>
    </div>
  )
}
