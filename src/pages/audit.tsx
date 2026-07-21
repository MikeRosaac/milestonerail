import { useMemo, useState } from 'react'
import {
  Banknote,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileCheck2,
  FileClock,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'
import { useDashboard } from '../hooks/use-app-data'
import { cn, formatDate, formatMoney, timeAgo, titleCase } from '../lib/utils'
import type { AuditEvent } from '../types'
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

type EventFilter = 'all' | AuditEvent['eventType']
type ActorFilter = 'all' | AuditEvent['actorRole']

const eventOptions: Array<{ value: EventFilter; label: string }> = [
  { value: 'all', label: 'All event types' },
  { value: 'evidence_submitted', label: 'Evidence submitted' },
  { value: 'changes_requested', label: 'Changes requested' },
  { value: 'mentor_approved', label: 'Mentor approved' },
  { value: 'finance_approved', label: 'Finance approved' },
  { value: 'payout_queued', label: 'Test payout queued' },
  { value: 'payout_paid', label: 'Test payout paid' },
  { value: 'payout_failed', label: 'Test payout failed' },
  { value: 'sla_flagged', label: 'SLA flagged' },
]

const actorOptions: Array<{ value: ActorFilter; label: string }> = [
  { value: 'all', label: 'All actors' },
  { value: 'learner', label: 'Learner' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'finance', label: 'Finance' },
  { value: 'admin', label: 'Admin' },
  { value: 'system', label: 'MilestoneRail system' },
  { value: 'provider', label: 'Paystack test provider' },
]

function AuditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingBlock className="h-4 w-20" />
        <LoadingBlock className="h-9 w-72" />
        <LoadingBlock className="h-5 w-[38rem] max-w-full" />
      </div>
      <LoadingBlock className="h-20" />
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <LoadingBlock className="h-[650px]" />
        <LoadingBlock className="h-[340px]" />
      </div>
    </div>
  )
}

function eventAppearance(type: AuditEvent['eventType']) {
  if (type === 'payout_paid') {
    return {
      icon: CheckCircle2,
      iconClass: 'bg-emerald-500 text-white',
      lineClass: 'bg-emerald-200',
    }
  }
  if (type === 'payout_failed' || type === 'changes_requested' || type === 'sla_flagged') {
    return {
      icon: RotateCcw,
      iconClass: 'bg-amber-100 text-amber-700 ring-4 ring-amber-50',
      lineClass: 'bg-amber-200',
    }
  }
  if (type === 'mentor_approved' || type === 'finance_approved') {
    return {
      icon: UserRoundCheck,
      iconClass: 'bg-violet-100 text-violet-700 ring-4 ring-violet-50',
      lineClass: 'bg-violet-200',
    }
  }
  if (type === 'payout_queued') {
    return {
      icon: Banknote,
      iconClass: 'bg-cyan-100 text-cyan-700 ring-4 ring-cyan-50',
      lineClass: 'bg-cyan-200',
    }
  }
  return {
    icon: FileCheck2,
    iconClass: 'bg-indigo-100 text-indigo-700 ring-4 ring-indigo-50',
    lineClass: 'bg-indigo-200',
  }
}

export function AuditPage() {
  const dashboardQuery = useDashboard()
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [actorFilter, setActorFilter] = useState<ActorFilter>('all')

  const dashboard = dashboardQuery.data
  const filteredEvents = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return (dashboard?.events || [])
      .filter((event) => eventFilter === 'all' || event.eventType === eventFilter)
      .filter((event) => actorFilter === 'all' || event.actorRole === actorFilter)
      .filter((event) => {
        if (!normalized) return true
        const submission = dashboard?.submissions.find((item) => item.id === event.submissionId)
        return [
          event.title,
          event.detail,
          event.actorName,
          event.eventType,
          submission?.learnerName,
          submission?.milestoneTitle,
          String(event.metadata?.providerReference || ''),
        ].some((value) => value?.toLowerCase().includes(normalized))
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [actorFilter, dashboard, eventFilter, search])

  if (dashboardQuery.isLoading) return <AuditSkeleton />

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <Notice tone="danger" title="Audit history could not load">
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

  const { cohort, events, submissions, payouts } = dashboardQuery.data
  const paidEvents = events.filter((event) => event.eventType === 'payout_paid')
  const providerEvents = events.filter((event) => event.actorRole === 'provider')
  const filtersActive = Boolean(search || eventFilter !== 'all' || actorFilter !== 'all')

  function clearFilters() {
    setSearch('')
    setEventFilter('all')
    setActorFilter('all')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit and controls"
        title="Shared event history"
        description="Inspect each evidence handoff, human decision, finance authorization, and Paystack test provider update in one ordered record."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800">
            <ShieldCheck className="size-4" aria-hidden />
            Role-visible record
          </span>
        }
      />

      <Notice tone="info" title="Judge demo audit context">
        Paystack entries are simulated test events. “Paid” means the local demo received its
        simulated signed webhook; it does not represent a real transfer or measured production
        impact.
      </Notice>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: FileClock,
            label: 'Visible events',
            value: events.length.toLocaleString(),
            context: 'For this role and cohort',
            tone: 'bg-indigo-50 text-indigo-700',
          },
          {
            icon: CheckCircle2,
            label: 'Paid test confirmations',
            value: paidEvents.length.toLocaleString(),
            context: 'Signed demo webhook events',
            tone: 'bg-emerald-50 text-emerald-700',
          },
          {
            icon: Sparkles,
            label: 'Provider-originated',
            value: providerEvents.length.toLocaleString(),
            context: 'Paystack test actor',
            tone: 'bg-cyan-50 text-cyan-700',
          },
        ].map(({ icon: Icon, label, value, context, tone }) => (
          <Card key={label} className="flex items-center gap-4 p-4">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-4.5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-black tracking-tight text-slate-950">{value}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{context}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-slate-400" aria-hidden />
          <p className="text-xs font-extrabold text-slate-700">Filter the event record</p>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-[11px] font-extrabold text-indigo-600 hover:text-indigo-500"
            >
              Clear all
            </button>
          ) : null}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_210px]">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <span className="sr-only">Search audit events</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field h-10 pl-9 text-xs"
              placeholder="Search learner, milestone, event, or reference…"
            />
          </label>
          <label>
            <span className="sr-only">Filter by event type</span>
            <select
              value={eventFilter}
              onChange={(event) => setEventFilter(event.target.value as EventFilter)}
              className="field h-10 py-0 text-xs"
            >
              {eventOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by actor</span>
            <select
              value={actorFilter}
              onChange={(event) => setActorFilter(event.target.value as ActorFilter)}
              className="field h-10 py-0 text-xs"
            >
              {actorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-extrabold tracking-tight text-slate-950">Event timeline</h2>
              <p className="mt-1 text-xs text-slate-500">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} shown ·
                newest first
              </p>
            </div>
            <span className="hidden items-center gap-1.5 text-[10px] font-bold text-slate-400 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Realtime sync on
            </span>
          </div>

          {filteredEvents.length ? (
            <ol className="px-5 py-2 sm:px-6">
              {filteredEvents.map((event, index) => {
                const appearance = eventAppearance(event.eventType)
                const Icon = appearance.icon
                const submission = submissions.find((item) => item.id === event.submissionId)
                const providerReference =
                  typeof event.metadata?.providerReference === 'string'
                    ? event.metadata.providerReference
                    : null
                return (
                  <li key={event.id} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 sm:gap-4">
                    <div className="relative flex justify-center">
                      {index < filteredEvents.length - 1 ? (
                        <span
                          className={cn('absolute bottom-0 top-9 w-px', appearance.lineClass)}
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={cn(
                          'relative z-10 mt-5 grid size-8 place-items-center rounded-full',
                          appearance.iconClass,
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                    </div>
                    <article className="border-b border-slate-100 py-5 last:border-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">{event.title}</h3>
                            <Badge value={event.eventType} />
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{event.detail}</p>
                        </div>
                        <time
                          dateTime={event.createdAt}
                          className="shrink-0 text-[10px] font-bold text-slate-400"
                          title={formatDate(event.createdAt, 'd MMM yyyy, h:mm a')}
                        >
                          {timeAgo(event.createdAt)}
                        </time>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={event.actorName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-extrabold text-slate-700">
                              {event.actorName}
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                              {titleCase(event.actorRole)} actor
                            </p>
                          </div>
                        </div>
                        <div className="min-w-0 sm:text-right">
                          <p className="truncate text-[11px] font-extrabold text-slate-700">
                            {submission?.learnerName || `Submission #${event.submissionId}`}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                            {submission?.milestoneTitle || 'Milestone record'}
                          </p>
                        </div>
                      </div>

                      {providerReference ? (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <ShieldCheck className="size-3.5 shrink-0 text-emerald-700" aria-hidden />
                          <p className="min-w-0 truncate font-mono text-[10px] font-semibold text-emerald-800">
                            Provider reference: {providerReference}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  </li>
                )
              })}
            </ol>
          ) : (
            <EmptyState
              icon={FileClock}
              title="No events match these filters"
              description="Adjust or clear the filters to return to the full shared history."
              action={
                filtersActive ? (
                  <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-extrabold text-slate-900">Audit context</h2>
            </div>
            <dl className="divide-y divide-slate-100 px-5">
              {[
                ['Program', cohort.programName],
                ['Cohort', cohort.name],
                ['Visible records', String(submissions.length)],
                ['Test payouts', String(payouts.length)],
                ['Currency', cohort.currency],
              ].map(([term, detail]) => (
                <div key={term} className="flex items-start justify-between gap-4 py-3.5">
                  <dt className="text-[11px] font-semibold text-slate-400">{term}</dt>
                  <dd className="max-w-[165px] text-right text-[11px] font-extrabold text-slate-700">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="border-indigo-200 bg-indigo-50/60 p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white">
              <ShieldCheck className="size-4" aria-hidden />
            </span>
            <h2 className="mt-4 text-sm font-extrabold text-slate-900">What this record proves</h2>
            <ul className="mt-3 space-y-3">
              {[
                'Who performed each human action',
                'Which milestone moved forward',
                'When the provider test event arrived',
                'The reference attached to paid test state',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[11px] leading-4 text-slate-600">
                  <CircleDot className="mt-0.5 size-3 shrink-0 text-indigo-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-slate-400" aria-hidden />
              <h2 className="text-xs font-extrabold text-slate-800">Period</h2>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-600">
              {formatDate(cohort.startDate)} – {formatDate(cohort.endDate)}
            </p>
            <p className="mt-2 text-[10px] leading-4 text-slate-400">
              Amounts are denominated in {cohort.currency}. Latest demo paid value:{' '}
              {payouts[0] ? formatMoney(payouts[0].amount, payouts[0].currency) : '—'}.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
