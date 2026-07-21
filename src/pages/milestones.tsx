import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  FileCheck2,
  FileText,
  Link2,
  LockKeyhole,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../auth/auth-context'
import { useDashboard, useSubmitEvidence } from '../hooks/use-app-data'
import { demoMilestones } from '../mocks/data'
import { cn, formatDate, formatMoney, timeAgo } from '../lib/utils'
import type { Milestone, Submission } from '../types'
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
} from '../components/ui'

const evidenceSchema = z
  .object({
    evidenceUrl: z
      .string()
      .trim()
      .refine((value) => !value || z.url().safeParse(value).success, {
        message: 'Enter a complete URL beginning with https://.',
      }),
    file: z.custom<FileList | undefined>(
      (value) => value === undefined || value instanceof FileList,
    ),
    note: z
      .string()
      .trim()
      .min(10, 'Add at least 10 characters of context for your mentor.')
      .max(600, 'Keep the evidence note under 600 characters.'),
  })
  .refine((values) => Boolean(values.evidenceUrl || values.file?.length), {
    message: 'Add an evidence URL or choose a file.',
    path: ['evidenceUrl'],
  })

type EvidenceValues = z.infer<typeof evidenceSchema>

function MilestonesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingBlock className="h-4 w-24" />
        <LoadingBlock className="h-9 w-64" />
        <LoadingBlock className="h-5 w-[34rem] max-w-full" />
      </div>
      <LoadingBlock className="h-36" />
      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <LoadingBlock key={index} className="h-[410px]" />
        ))}
      </div>
    </div>
  )
}

function statusCopy(submission?: Submission) {
  if (!submission) return { label: 'Upcoming', tone: 'text-slate-500', progress: 0 }
  if (submission.status === 'paid') {
    return { label: 'Complete · paid test record', tone: 'text-emerald-700', progress: 100 }
  }
  if (submission.status === 'changes_requested') {
    return { label: 'Changes requested', tone: 'text-amber-700', progress: 25 }
  }
  if (submission.status === 'submitted') {
    return { label: 'With mentor', tone: 'text-violet-700', progress: 45 }
  }
  if (submission.status === 'awaiting_finance') {
    return { label: 'Finance ready', tone: 'text-indigo-700', progress: 70 }
  }
  if (submission.status === 'processing') {
    return { label: 'Paystack test processing', tone: 'text-cyan-700', progress: 88 }
  }
  if (submission.status === 'failed') {
    return { label: 'Test payout needs attention', tone: 'text-rose-700', progress: 88 }
  }
  return { label: 'Ready for evidence', tone: 'text-blue-700', progress: 12 }
}

function EvidenceDialog({
  submission,
  open,
  onClose,
  onSuccess,
}: {
  submission: Submission | null
  open: boolean
  onClose: () => void
  onSuccess: (submission: Submission) => void
}) {
  const submitEvidence = useSubmitEvidence()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EvidenceValues>({
    resolver: zodResolver(evidenceSchema),
    values: {
      evidenceUrl: submission?.evidenceUrl || '',
      file: undefined,
      note: submission?.evidenceNote || '',
    },
  })

  async function onSubmit(values: EvidenceValues) {
    if (!submission) return
    try {
      const result = await submitEvidence.mutateAsync({
        submissionId: submission.id,
        evidenceUrl: values.evidenceUrl || undefined,
        file: values.file?.[0],
        note: values.note,
      })
      onSuccess(result)
    } catch {
      // Mutation state renders the actionable error in the dialog.
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!submitEvidence.isPending) onClose()
      }}
      title={submission?.status === 'changes_requested' ? 'Resubmit evidence' : 'Submit evidence'}
      description={
        submission
          ? `${submission.milestoneTitle} · ${formatMoney(submission.amount)} eligible stipend`
          : undefined
      }
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitEvidence.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="evidence-form" loading={submitEvidence.isPending}>
            <Send className="size-4" aria-hidden />
            Send to mentor
          </Button>
        </>
      }
    >
      <form id="evidence-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Notice tone="info" title="Share reviewable proof">
          Add a URL, a file, or both. Your note gives the mentor enough context to review the work.
        </Notice>

        {submission?.reviewerFeedback ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-amber-800">
              Mentor feedback
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900">{submission.reviewerFeedback}</p>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Link2 className="size-4 text-slate-400" aria-hidden />
            Evidence URL
            <span className="font-medium text-slate-400">Optional</span>
          </span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://github.com/your-project"
            className={cn('field', errors.evidenceUrl && 'border-rose-300 ring-rose-100')}
            aria-invalid={Boolean(errors.evidenceUrl)}
            {...register('evidenceUrl')}
          />
          {errors.evidenceUrl ? (
            <p className="mt-1.5 text-xs font-semibold text-rose-600">
              {errors.evidenceUrl.message}
            </p>
          ) : null}
        </label>

        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
            and / or
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <label className="group block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center transition hover:border-indigo-300 hover:bg-indigo-50/50">
          <UploadCloud
            className="mx-auto size-6 text-slate-400 transition group-hover:text-indigo-600"
            aria-hidden
          />
          <span className="mt-3 block text-sm font-extrabold text-slate-700">
            Choose an evidence file
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-400">
            PDF, image, video, or document. Demo uploads keep only the file name.
          </span>
          <input type="file" className="sr-only" {...register('file')} />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <FileText className="size-4 text-slate-400" aria-hidden />
            Context note
          </span>
          <textarea
            rows={4}
            placeholder="What did you build, where should the mentor look, and what should they test?"
            className={cn('field min-h-28 resize-y py-3', errors.note && 'border-rose-300')}
            aria-invalid={Boolean(errors.note)}
            {...register('note')}
          />
          <div className="mt-1.5 flex items-start justify-between gap-4">
            <p className="text-xs font-semibold text-rose-600">{errors.note?.message}</p>
            <p className="shrink-0 text-[10px] font-semibold text-slate-400">10–600 characters</p>
          </div>
        </label>

        {submitEvidence.isError ? (
          <div role="alert">
            <Notice tone="danger" title="Evidence was not submitted">
              {submitEvidence.error.message}
            </Notice>
          </div>
        ) : null}
      </form>
    </Dialog>
  )
}

function MilestoneCard({
  milestone,
  submission,
  index,
  canSubmit,
  onSubmit,
}: {
  milestone: Milestone
  submission?: Submission
  index: number
  canSubmit: boolean
  onSubmit: (submission: Submission) => void
}) {
  const state = statusCopy(submission)
  const isPaid = submission?.status === 'paid'
  const isActionable =
    canSubmit && submission && ['draft', 'changes_requested'].includes(submission.status)

  return (
    <Card
      className={cn(
        'relative flex min-h-[410px] flex-col overflow-hidden p-5 sm:p-6',
        isActionable && 'border-indigo-200 shadow-[0_18px_55px_-32px_rgba(79,70,229,.55)]',
      )}
    >
      {isActionable ? (
        <span className="absolute right-0 top-0 rounded-bl-2xl bg-indigo-600 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
          Your next step
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            'grid size-10 place-items-center rounded-xl text-sm font-black',
            isPaid
              ? 'bg-emerald-50 text-emerald-700'
              : isActionable
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-slate-100 text-slate-500',
          )}
        >
          {isPaid ? <Check className="size-4.5" strokeWidth={3} aria-hidden /> : `0${index + 1}`}
        </span>
        <Badge value={submission?.status || 'draft'}>{submission ? undefined : 'Upcoming'}</Badge>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-950">{milestone.title}</h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{milestone.description}</p>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className={cn('text-xs font-extrabold', state.tone)}>{state.label}</p>
          <p className="text-[10px] font-bold text-slate-400">{state.progress}%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isPaid
                ? 'bg-emerald-500'
                : submission?.status === 'changes_requested'
                  ? 'bg-amber-500'
                  : 'bg-indigo-500',
            )}
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Due</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
            <CalendarDays className="size-3.5 text-slate-400" aria-hidden />
            {formatDate(milestone.dueAt, 'd MMM yyyy')}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Eligible</dt>
          <dd className="mt-1 text-xs font-extrabold text-slate-700">
            {formatMoney(milestone.amount)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        {isActionable ? (
          <Button type="button" className="w-full" onClick={() => onSubmit(submission)}>
            <UploadCloud className="size-4" aria-hidden />
            {submission.status === 'changes_requested' ? 'Resubmit evidence' : 'Submit evidence'}
          </Button>
        ) : submission?.evidenceUrl ? (
          <a
            href={submission.evidenceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FileCheck2 className="size-4" aria-hidden />
            View submitted evidence
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        ) : (
          <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-400">
            {submission?.status === 'submitted' ? (
              <>
                <Sparkles className="size-4" aria-hidden />
                Mentor review in progress
              </>
            ) : (
              <>
                <LockKeyhole className="size-4" aria-hidden />
                Opens after the prior milestone
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export function MilestonesPage() {
  const { session } = useAuth()
  const dashboardQuery = useDashboard()
  const [selected, setSelected] = useState<Submission | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  if (dashboardQuery.isLoading) return <MilestonesSkeleton />

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <Notice tone="danger" title="Milestones could not load">
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

  const { cohort, submissions: allSubmissions } = dashboardQuery.data
  const learnerId = session?.user.role === 'learner' ? session.user.id : 101
  const submissions = allSubmissions.filter((submission) => submission.learnerId === learnerId)
  const milestones = demoMilestones.filter((milestone) => milestone.cohortId === cohort.id)
  const completed = submissions.filter((submission) => submission.status === 'paid').length
  const progress = milestones.length ? Math.round((completed / milestones.length) * 100) : 0
  const canSubmit = session?.user.role === 'learner'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={canSubmit ? 'Your milestone rail' : 'Learner rail preview'}
        title={canSubmit ? `Keep moving, ${session.user.name.split(' ')[0]}` : 'Amara’s milestones'}
        description={`${cohort.programName} · Complete each evidence and approval gate to unlock its eligible stipend.`}
        actions={
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Overall progress
            </p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{progress}% complete</p>
          </div>
        }
      />

      {successMessage ? (
        <div role="status">
          <Notice tone="success" title="Evidence sent to mentor">
            {successMessage}
          </Notice>
        </div>
      ) : null}

      {!canSubmit ? (
        <Notice tone="info" title="Admin read-only preview">
          Switch to the Learner demo role to submit evidence and run the end-to-end judge flow.
        </Notice>
      ) : null}

      <Card className="overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-indigo-600">
              Cohort progress
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {completed} of {milestones.length} milestones complete
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Next: submit API capstone evidence for mentor review.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Earned · demo
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">
                {formatMoney(
                  submissions
                    .filter((submission) => submission.status === 'paid')
                    .reduce((sum, submission) => sum + submission.amount, 0),
                  cohort.currency,
                )}
              </p>
            </div>
            <div
              className="grid size-16 place-items-center rounded-full p-1.5"
              style={{
                background: `conic-gradient(#4f46e5 ${progress}%, #e2e8f0 0)`,
              }}
            >
              <div className="grid size-full place-items-center rounded-full bg-white text-xs font-black text-indigo-700">
                {progress}%
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {milestones.length ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {milestones.map((milestone, index) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              submission={submissions.find((item) => item.milestoneId === milestone.id)}
              index={index}
              canSubmit={Boolean(canSubmit)}
              onSubmit={(submission) => {
                setSuccessMessage('')
                setSelected(submission)
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Circle}
            title="No milestones assigned"
            description="Your program team has not published milestones for this cohort yet."
          />
        </Card>
      )}

      <Card className="grid gap-5 overflow-hidden border-slate-800 bg-slate-950 p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-indigo-200">
            <Paperclip className="size-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-extrabold">A shared receipt follows every decision</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Your submission, mentor feedback, finance approval, and Paystack test webhook stay
              together in the audit trail.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="size-4" aria-hidden />
          Last paid test event {submissions[0]?.updatedAt ? timeAgo(submissions[0].updatedAt) : '—'}
        </div>
      </Card>

      <EvidenceDialog
        submission={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onSuccess={(submission) => {
          setSelected(null)
          setSuccessMessage(
            `${submission.milestoneTitle} is now in the mentor review queue. Switch to the Mentor role to continue.`,
          )
        }}
      />
    </div>
  )
}
