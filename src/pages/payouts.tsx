import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Inbox,
  Landmark,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { useDashboard, useInitiatePayout } from '../hooks/use-app-data'
import { cn, formatDate, formatMoney, timeAgo } from '../lib/utils'
import type { Submission } from '../types'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
} from '../components/ui'

function PayoutsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingBlock className="h-4 w-24" />
        <LoadingBlock className="h-9 w-72" />
        <LoadingBlock className="h-5 w-[36rem] max-w-full" />
      </div>
      <LoadingBlock className="h-48" />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <LoadingBlock className="h-[400px]" />
        <LoadingBlock className="h-[400px]" />
      </div>
    </div>
  )
}

function AuthorizationDialog({
  submission,
  onClose,
  onAuthorized,
}: {
  submission: Submission | null
  onClose: () => void
  onAuthorized: (submission: Submission) => void
}) {
  const initiatePayout = useInitiatePayout()
  const [confirmed, setConfirmed] = useState(false)

  function close() {
    if (initiatePayout.isPending) return
    initiatePayout.reset()
    setConfirmed(false)
    onClose()
  }

  async function authorize() {
    if (!submission || !confirmed) return
    try {
      await initiatePayout.mutateAsync(submission.id)
      setConfirmed(false)
      onAuthorized(submission)
    } catch {
      // Mutation state renders the actionable error in the dialog.
    }
  }

  return (
    <Dialog
      open={Boolean(submission)}
      onClose={close}
      title="Authorize test payout"
      description={
        submission
          ? `${submission.learnerName} · ${formatMoney(submission.amount)} eligible stipend`
          : undefined
      }
      footer={
        <>
          <Button type="button" variant="ghost" onClick={close} disabled={initiatePayout.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            loading={initiatePayout.isPending}
            disabled={!confirmed}
            onClick={() => void authorize()}
          >
            <LockKeyhole className="size-4" aria-hidden />
            Authorize Paystack test
          </Button>
        </>
      }
    >
      {submission ? (
        <div className="space-y-5">
          <Notice tone="info" title="Paystack test mode">
            This action simulates a provider transfer and signed webhook. No real account is debited
            and no real money moves.
          </Notice>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={submission.learnerName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900">
                  {submission.learnerName}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {submission.milestoneTitle}
                </p>
              </div>
              <p className="text-lg font-black tracking-tight text-slate-950">
                {formatMoney(submission.amount)}
              </p>
            </div>
          </div>

          <section aria-labelledby="checks-heading">
            <h3 id="checks-heading" className="text-sm font-extrabold text-slate-900">
              Authorization checks
            </h3>
            <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
              {[
                ['Mentor approval recorded', 'Evidence passed the milestone rubric.'],
                ['Learner eligibility active', 'Cohort membership is current.'],
                ['Budget capacity available', `${formatMoney(submission.amount)} remains covered.`],
                ['Idempotency protection on', 'Repeat authorization cannot duplicate this payout.'],
              ].map(([title, description]) => (
                <div key={title} className="flex gap-3 py-3.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
              confirmed
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              <span className="block text-xs font-extrabold text-slate-900">
                I confirm this is a Paystack test action
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                I understand this does not send real money and is for the judge demo only.
              </span>
            </span>
          </label>

          {initiatePayout.isError ? (
            <div role="alert">
              <Notice tone="danger" title="Test payout was not queued">
                {initiatePayout.error.message}
              </Notice>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  )
}

export function PayoutsPage() {
  const dashboardQuery = useDashboard()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Submission | null>(null)
  const [lastInitiated, setLastInitiated] = useState<number | null>(null)

  const submissions = dashboardQuery.data?.submissions
  const eligible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return (submissions || [])
      .filter((submission) => submission.status === 'awaiting_finance')
      .filter(
        (submission) =>
          !normalized ||
          submission.learnerName.toLowerCase().includes(normalized) ||
          submission.milestoneTitle.toLowerCase().includes(normalized),
      )
  }, [query, submissions])

  if (dashboardQuery.isLoading) return <PayoutsSkeleton />

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <Notice tone="danger" title="Payout operations could not load">
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

  const { cohort, payouts, submissions: allSubmissions } = dashboardQuery.data
  const available = cohort.budget - cohort.committed
  const utilization = Math.round((cohort.committed / cohort.budget) * 100)
  const allEligible = allSubmissions.filter(
    (submission) => submission.status === 'awaiting_finance',
  )
  const eligibleTotal = allEligible.reduce((sum, submission) => sum + submission.amount, 0)
  const activePayout = lastInitiated
    ? payouts.find((payout) => payout.submissionId === lastInitiated)
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance operations"
        title="Stipend authorization"
        description="Verify eligibility and budget, then hand a protected test transfer to Paystack. Every provider update returns to the shared audit trail."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-800">
            <ShieldAlert className="size-4" aria-hidden />
            Test mode · No real money
          </span>
        }
      />

      {lastInitiated && activePayout ? (
        <div role="status" aria-live="polite">
          <Notice
            tone="success"
            title={
              activePayout.status === 'paid' ? 'Signed webhook received' : 'Test payout queued'
            }
          >
            {activePayout.status === 'paid'
              ? `${activePayout.learnerName} now has a paid test record. Open Audit to inspect the Paystack test event and provider reference.`
              : `Paystack test is processing ${formatMoney(activePayout.amount, activePayout.currency)} for ${activePayout.learnerName}. Wait briefly for the simulated signed webhook. No real money moves.`}
          </Notice>
        </div>
      ) : null}

      <Card className="relative overflow-hidden border-slate-800 bg-slate-950 p-5 text-white sm:p-6">
        <div
          className="absolute -right-16 -top-20 size-64 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-200">
              <WalletCards className="size-3.5" aria-hidden />
              Cohort budget control
            </span>
            <p className="mt-5 text-4xl font-black tracking-[-0.045em]">
              {formatMoney(cohort.budget, cohort.currency)}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Approved demo program budget
            </p>
          </div>
          <div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Committed', formatMoney(cohort.committed, cohort.currency)],
                ['Paid · demo', formatMoney(cohort.disbursed, cohort.currency)],
                ['Uncommitted', formatMoney(available, cohort.currency)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/8 bg-white/[0.045] p-3">
                  <p className="text-[10px] font-bold text-slate-500">{label}</p>
                  <p className="mt-2 truncate text-sm font-extrabold text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-4 text-[10px] font-bold text-slate-400">
                <span>{utilization}% committed</span>
                <span>{formatMoney(eligibleTotal, cohort.currency)} pending authorization</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-extrabold tracking-tight text-slate-950">Eligible queue</h2>
              <p className="mt-1 text-xs text-slate-500">
                Mentor-approved milestones awaiting finance authorization.
              </p>
            </div>
            <label className="relative block w-full sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <span className="sr-only">Search eligible payouts</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field h-10 pl-9 text-xs"
                placeholder="Search eligible queue…"
              />
            </label>
          </div>
          {eligible.length ? (
            <div className="divide-y divide-slate-100">
              {eligible.map((submission) => (
                <article
                  key={submission.id}
                  className="grid gap-4 px-5 py-5 transition hover:bg-slate-50/80 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={submission.learnerName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {submission.learnerName}
                        </p>
                        <Badge value="awaiting_finance" />
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {submission.milestoneTitle} · {formatMoney(submission.amount)}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        Mentor note: {submission.reviewerFeedback || 'Approval recorded'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setSelected(submission)}
                    className="w-full sm:w-auto"
                  >
                    Authorize test payout
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                </article>
              ))}
            </div>
          ) : query ? (
            <EmptyState
              icon={Search}
              title="No matching eligible records"
              description="Try another learner name or milestone title."
              action={
                <Button type="button" variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No payouts need authorization"
              description="Mentor-approved milestones will appear here. For the judge flow, approve Amara’s API capstone from the Mentor role."
            />
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="font-extrabold tracking-tight text-slate-950">Provider activity</h2>
              <p className="mt-1 text-xs text-slate-500">Paystack test records only.</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
              <Landmark className="size-4" aria-hidden />
            </span>
          </div>
          {payouts.length ? (
            <div className="divide-y divide-slate-100 px-5">
              {payouts.slice(0, 6).map((payout) => (
                <div key={payout.id} className="flex gap-3 py-4">
                  <span
                    className={cn(
                      'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full',
                      payout.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : payout.status === 'failed'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-cyan-50 text-cyan-700',
                    )}
                  >
                    {payout.status === 'paid' ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : payout.status === 'failed' ? (
                      <ShieldAlert className="size-4" aria-hidden />
                    ) : (
                      <Clock3 className="size-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-xs font-extrabold text-slate-800">
                        {payout.learnerName}
                      </p>
                      <p className="shrink-0 text-xs font-black text-slate-800">
                        {formatMoney(payout.amount, payout.currency)}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {payout.milestoneTitle}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <Badge value={payout.status} />
                      <span className="truncate text-right text-[9px] font-semibold text-slate-400">
                        {payout.paidAt
                          ? timeAgo(payout.paidAt)
                          : payout.approvedAt
                            ? `Queued ${timeAgo(payout.approvedAt)}`
                            : 'Pending'}
                      </span>
                    </div>
                    {payout.providerReference ? (
                      <p className="mt-2 truncate font-mono text-[9px] text-slate-400">
                        {payout.providerReference}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Banknote}
              title="No test provider records"
              description="Authorized demo payouts and webhook results will appear here."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: FileCheck2,
            title: 'Mentor gate',
            text: 'Only rubric-approved milestones reach finance.',
          },
          {
            icon: ShieldCheck,
            title: 'Idempotent request',
            text: 'One submission maps to one protected provider reference.',
          },
          {
            icon: Sparkles,
            title: 'Signed update',
            text: 'The simulated webhook, not the button click, sets paid state.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} className="flex gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
              <Icon className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-800">{title}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{text}</p>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-center text-[10px] font-semibold text-slate-400">
        Demo period: {formatDate(cohort.startDate)}–{formatDate(cohort.endDate)} · Test data only
      </p>

      <AuthorizationDialog
        submission={selected}
        onClose={() => setSelected(null)}
        onAuthorized={(submission) => {
          setSelected(null)
          setLastInitiated(submission.id)
        }}
      />
    </div>
  )
}
