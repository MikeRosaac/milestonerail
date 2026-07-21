import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileImage,
  FileSearch,
  Inbox,
  Link2,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useDashboard, useReviewSubmission } from '../hooks/use-app-data'
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

const rubricItems = [
  {
    title: 'Working product evidence',
    description: 'The primary workflow is visible and can be evaluated.',
  },
  {
    title: 'API integration is clear',
    description: 'The evidence identifies a real API-backed product flow.',
  },
  {
    title: 'Decisions are documented',
    description: 'Implementation context and failure handling are explained.',
  },
]

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingBlock className="h-4 w-24" />
        <LoadingBlock className="h-9 w-72" />
        <LoadingBlock className="h-5 w-[32rem] max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <LoadingBlock key={index} className="h-28" />
        ))}
      </div>
      <LoadingBlock className="h-[430px]" />
    </div>
  )
}

function ReviewDialog({
  submission,
  onClose,
  onComplete,
}: {
  submission: Submission | null
  onClose: () => void
  onComplete: (decision: 'approve' | 'changes', submission: Submission) => void
}) {
  const reviewSubmission = useReviewSubmission()
  const [feedback, setFeedback] = useState('')
  const [rubric, setRubric] = useState([true, true, true])

  function close() {
    if (reviewSubmission.isPending) return
    reviewSubmission.reset()
    setFeedback('')
    setRubric([true, true, true])
    onClose()
  }

  async function decide(decision: 'approve' | 'changes') {
    if (!submission) return
    try {
      const result = await reviewSubmission.mutateAsync({
        submissionId: submission.id,
        decision,
        feedback:
          feedback.trim() ||
          (decision === 'approve'
            ? 'Evidence meets the API capstone rubric and is ready for finance.'
            : ''),
      })
      setFeedback('')
      setRubric([true, true, true])
      onComplete(decision, result)
    } catch {
      // Mutation state renders the actionable error in the dialog.
    }
  }

  const allRubricMet = rubric.every(Boolean)
  const canRequestChanges = feedback.trim().length >= 8

  return (
    <Dialog
      open={Boolean(submission)}
      onClose={close}
      title="Review milestone evidence"
      description={
        submission ? `${submission.learnerName} · ${submission.milestoneTitle}` : undefined
      }
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            disabled={reviewSubmission.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canRequestChanges || reviewSubmission.isPending}
            onClick={() => void decide('changes')}
          >
            <MessageSquareText className="size-4" aria-hidden />
            Request changes
          </Button>
          <Button
            type="button"
            loading={reviewSubmission.isPending}
            disabled={!allRubricMet}
            onClick={() => void decide('approve')}
          >
            <Check className="size-4" aria-hidden />
            Approve milestone
          </Button>
        </>
      }
    >
      {submission ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                Submitted
              </p>
              <p className="mt-1.5 text-xs font-bold text-slate-700">
                {submission.submittedAt ? timeAgo(submission.submittedAt) : 'Not submitted'}
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-400">
                Eligible stipend
              </p>
              <p className="mt-1.5 text-xs font-black text-indigo-800">
                {formatMoney(submission.amount)}
              </p>
            </div>
          </div>

          <section aria-labelledby="evidence-heading">
            <div className="flex items-center justify-between gap-4">
              <h3 id="evidence-heading" className="text-sm font-extrabold text-slate-900">
                Submitted evidence
              </h3>
              <Badge value={submission.status} />
            </div>
            <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              {submission.evidenceUrl ? (
                <a
                  href={submission.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-indigo-200 hover:shadow-sm"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
                    <Link2 className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold text-slate-800">
                      Open project evidence
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                      {submission.evidenceUrl}
                    </span>
                  </span>
                  <ExternalLink
                    className="size-4 text-slate-300 group-hover:text-indigo-500"
                    aria-hidden
                  />
                </a>
              ) : null}
              {submission.evidenceFileName ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700">
                    <FileImage className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800">Attached file</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {submission.evidenceFileName}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl bg-white p-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                  Learner note
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {submission.evidenceNote || 'No context note was provided.'}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="rubric-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 id="rubric-heading" className="text-sm font-extrabold text-slate-900">
                  API capstone rubric
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Confirm each standard before approval.
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700">
                {rubric.filter(Boolean).length}/{rubric.length} met
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {rubricItems.map((item, index) => (
                <label
                  key={item.title}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition',
                    rubric[index]
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-slate-200 bg-white hover:bg-slate-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={rubric[index]}
                    onChange={() =>
                      setRubric((current) =>
                        current.map((checked, itemIndex) =>
                          itemIndex === index ? !checked : checked,
                        ),
                      )
                    }
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border',
                      rubric[index]
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white',
                    )}
                  >
                    {rubric[index] ? (
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    ) : null}
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold text-slate-800">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                      {item.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <label className="block">
            <span className="mb-2 flex items-center justify-between gap-4 text-sm font-extrabold text-slate-900">
              Review note
              <span className="text-[10px] font-semibold text-slate-400">Required for changes</span>
            </span>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={4}
              className="field min-h-28 resize-y py-3"
              placeholder="Share a clear approval note or explain exactly what must change…"
            />
          </label>

          {reviewSubmission.isError ? (
            <div role="alert">
              <Notice tone="danger" title="Decision was not saved">
                {reviewSubmission.error.message}
              </Notice>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  )
}

export function ReviewsPage() {
  const dashboardQuery = useDashboard()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Submission | null>(null)
  const [result, setResult] = useState<{ tone: 'success'; message: string } | null>(null)

  const submissions = dashboardQuery.data?.submissions
  const queue = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return (submissions || [])
      .filter((submission) => submission.status === 'submitted')
      .filter(
        (submission) =>
          !normalized ||
          submission.learnerName.toLowerCase().includes(normalized) ||
          submission.milestoneTitle.toLowerCase().includes(normalized),
      )
      .sort(
        (a, b) =>
          new Date(a.submittedAt || a.updatedAt).getTime() -
          new Date(b.submittedAt || b.updatedAt).getTime(),
      )
  }, [query, submissions])

  if (dashboardQuery.isLoading) return <ReviewsSkeleton />

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <Notice tone="danger" title="Review queue could not load">
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

  const allWaiting = dashboardQuery.data.submissions.filter(
    (submission) => submission.status === 'submitted',
  )
  const eligibleValue = allWaiting.reduce((sum, submission) => sum + submission.amount, 0)
  const oldest = allWaiting
    .map((submission) => submission.submittedAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mentor review"
        title="Evidence review queue"
        description="Validate submitted work against the milestone rubric, then advance it to finance or return focused feedback."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700">
            <ShieldCheck className="size-4" aria-hidden />
            Human approval gate
          </span>
        }
      />

      {result ? (
        <div role="status">
          <Notice tone={result.tone} title="Review decision saved">
            {result.message}
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: FileSearch,
            label: 'Awaiting review',
            value: allWaiting.length.toLocaleString(),
            context: 'Submitted evidence',
            tone: 'bg-violet-50 text-violet-700',
          },
          {
            icon: Clock3,
            label: 'Oldest waiting',
            value: oldest ? timeAgo(oldest) : 'Queue clear',
            context: '24-hour review SLA',
            tone: 'bg-amber-50 text-amber-700',
          },
          {
            icon: Sparkles,
            label: 'Eligible after approval',
            value: formatMoney(eligibleValue),
            context: 'Subject to finance checks',
            tone: 'bg-emerald-50 text-emerald-700',
          },
        ].map(({ icon: Icon, label, value, context, tone }) => (
          <Card key={label} className="flex items-start gap-4 p-5">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-2 truncate text-xl font-black tracking-tight text-slate-950">
                {value}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">{context}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-extrabold tracking-tight text-slate-950">Ready for decision</h2>
            <p className="mt-1 text-xs text-slate-500">
              Oldest submissions are shown first to protect the review SLA.
            </p>
          </div>
          <label className="relative block w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <span className="sr-only">Search review queue</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field h-10 pl-9 text-xs"
              placeholder="Search learner or milestone…"
            />
          </label>
        </div>

        {queue.length ? (
          <div>
            <div className="hidden grid-cols-[1.2fr_1.35fr_0.65fr_0.65fr_auto] gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:grid">
              <span>Learner</span>
              <span>Milestone</span>
              <span>Submitted</span>
              <span>Eligible</span>
              <span className="w-24">Action</span>
            </div>
            <div className="divide-y divide-slate-100">
              {queue.map((submission) => (
                <article
                  key={submission.id}
                  className="grid gap-4 px-5 py-5 transition hover:bg-slate-50/80 md:grid-cols-[1.2fr_1.35fr_0.65fr_0.65fr_auto] md:items-center md:px-6"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={submission.learnerName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-900">
                        {submission.learnerName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Submission #{submission.id}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-700">
                      {submission.milestoneTitle}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {submission.evidenceFileName || submission.evidenceUrl || 'Context note'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600">
                      {submission.submittedAt ? timeAgo(submission.submittedAt) : '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Due {formatDate(submission.dueAt, 'd MMM')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-700">
                      {formatMoney(submission.amount)}
                    </p>
                    <Badge value="submitted" className="mt-1" />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full md:w-24"
                    onClick={() => {
                      setResult(null)
                      setSelected(submission)
                    }}
                  >
                    Review
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Button>
                </article>
              ))}
            </div>
          </div>
        ) : query ? (
          <EmptyState
            icon={Search}
            title="No matching submissions"
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
            title="Review queue is clear"
            description="New learner evidence will appear here immediately. In the judge flow, switch to Learner and submit the API capstone."
          />
        )}
      </Card>

      <Card className="flex flex-col gap-4 border-violet-200 bg-violet-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-white">
            <CheckCircle2 className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Approval is not payout authorization
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Mentor approval advances the milestone to a separate finance eligibility and budget
              check.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-violet-700">Separation of duties</span>
      </Card>

      <ReviewDialog
        submission={selected}
        onClose={() => setSelected(null)}
        onComplete={(decision, submission) => {
          setSelected(null)
          setResult({
            tone: 'success',
            message:
              decision === 'approve'
                ? `${submission.learnerName}’s ${submission.milestoneTitle} is finance-ready. Switch to Finance to authorize the Paystack test payout.`
                : `${submission.learnerName} received your requested changes and can resubmit.`,
          })
        }}
      />
    </div>
  )
}
