import {
  demoActivity,
  demoCohort,
  demoUsers,
  demoWorkflowSteps,
  initialEvents,
  initialPayouts,
  initialSubmissions,
} from './data'
import type {
  AuditEvent,
  DashboardData,
  Payout,
  Role,
  Session,
  Submission,
  User,
  WorkflowStep,
} from '../types'
import { sleep } from '../lib/utils'

type StoreEvent = 'submission.updated' | 'payout.updated' | 'workflow.updated'

interface DemoState {
  submissions: Submission[]
  payouts: Payout[]
  events: AuditEvent[]
  workflow: WorkflowStep[]
}

const freshState = (): DemoState => ({
  submissions: structuredClone(initialSubmissions),
  payouts: structuredClone(initialPayouts),
  events: structuredClone(initialEvents),
  workflow: structuredClone(demoWorkflowSteps),
})

let state = freshState()
const listeners = new Set<(event: StoreEvent) => void>()

function emit(event: StoreEvent) {
  listeners.forEach((listener) => listener(event))
}

function nextId(items: Array<{ id: number }>) {
  return Math.max(0, ...items.map((item) => item.id)) + 1
}

function findUser(id: number) {
  return demoUsers.find((user) => user.id === id)
}

function assertRole(user: User, ...roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new Error(`This action requires the ${roles.join(' or ')} role.`)
  }
}

function appendEvent(
  submissionId: number,
  actor: User | null,
  input: Omit<AuditEvent, 'id' | 'submissionId' | 'actorId' | 'actorName' | 'actorRole'> & {
    actorName?: string
    actorRole?: AuditEvent['actorRole']
  },
) {
  const event: AuditEvent = {
    id: nextId(state.events),
    submissionId,
    actorId: actor?.id ?? null,
    actorName: input.actorName ?? actor?.name ?? 'MilestoneRail',
    actorRole: input.actorRole ?? actor?.role ?? 'system',
    eventType: input.eventType,
    title: input.title,
    detail: input.detail,
    createdAt: input.createdAt,
    metadata: input.metadata,
  }
  state.events = [event, ...state.events]
}

export const demoStore = {
  async signIn(email: string, password: string): Promise<Session> {
    await sleep(350)
    if (password !== 'demo2026') {
      throw new Error('Use the demo password: demo2026')
    }
    const user = demoUsers.find((candidate) => candidate.email === email)
    if (!user) throw new Error('No demo account matches that email.')

    return {
      token: `demo.${user.role}.${user.id}`,
      user,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    }
  },

  sessionForRole(role: Role): Session {
    const user = demoUsers.find((candidate) => candidate.role === role)
    if (!user) throw new Error(`No ${role} demo account is configured.`)
    return {
      token: `demo.${user.role}.${user.id}`,
      user,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    }
  },

  async dashboard(user: User): Promise<DashboardData> {
    await sleep(180)
    const submissions =
      user.role === 'learner'
        ? state.submissions.filter((submission) => submission.learnerId === user.id)
        : state.submissions
    const payoutIds = new Set(submissions.map((submission) => submission.id))
    const payouts = state.payouts.filter((payout) => payoutIds.has(payout.submissionId))
    const events = state.events.filter((event) => payoutIds.has(event.submissionId))

    return {
      cohort: demoCohort,
      summary: {
        activeLearners: demoCohort.learnerCount,
        awaitingReview: state.submissions.filter((item) => item.status === 'submitted').length,
        awaitingFinance: state.submissions.filter((item) => item.status === 'awaiting_finance')
          .length,
        paidThisMonth: state.payouts
          .filter((payout) => payout.status === 'paid')
          .reduce((sum, payout) => sum + payout.amount, 3_810_000),
        atRisk: 3,
        averageReviewHours: 7.4,
        completionRate: 82,
      },
      activity: demoActivity,
      submissions: structuredClone(submissions),
      payouts: structuredClone(payouts),
      events: structuredClone(events),
    }
  },

  async workflow(): Promise<WorkflowStep[]> {
    await sleep(120)
    return structuredClone(state.workflow).sort((a, b) => a.position - b.position)
  },

  async submitEvidence(
    user: User,
    input: {
      submissionId: number
      evidenceUrl?: string
      evidenceFileName?: string
      note: string
    },
  ): Promise<Submission> {
    assertRole(user, 'learner')
    await sleep(550)
    const submission = state.submissions.find((item) => item.id === input.submissionId)
    if (!submission || submission.learnerId !== user.id) {
      throw new Error('Submission not found for this learner.')
    }
    if (!['draft', 'changes_requested'].includes(submission.status)) {
      throw new Error('This milestone has already been submitted.')
    }

    const now = new Date().toISOString()
    Object.assign(submission, {
      evidenceUrl: input.evidenceUrl || 'https://storage.lingoql.com/demo/evidence.pdf',
      evidenceFileName: input.evidenceFileName || null,
      evidenceNote: input.note,
      status: 'submitted',
      currentStepId: 502,
      submittedAt: now,
      updatedAt: now,
      reviewerFeedback: null,
    } satisfies Partial<Submission>)
    appendEvent(submission.id, user, {
      eventType: 'evidence_submitted',
      title: 'Evidence submitted',
      detail: `${submission.milestoneTitle} is ready for mentor review.`,
      createdAt: now,
    })
    emit('submission.updated')
    return structuredClone(submission)
  },

  async review(
    user: User,
    input: { submissionId: number; decision: 'approve' | 'changes'; feedback: string },
  ): Promise<Submission> {
    assertRole(user, 'mentor', 'admin')
    await sleep(500)
    const submission = state.submissions.find((item) => item.id === input.submissionId)
    if (!submission || submission.status !== 'submitted') {
      throw new Error('This submission is no longer awaiting mentor review.')
    }

    const now = new Date().toISOString()
    submission.reviewerFeedback = input.feedback
    submission.updatedAt = now
    if (input.decision === 'approve') {
      submission.status = 'awaiting_finance'
      submission.currentStepId = 503
      appendEvent(submission.id, user, {
        eventType: 'mentor_approved',
        title: 'Milestone approved',
        detail: input.feedback || 'Evidence met the milestone rubric and advanced to finance.',
        createdAt: now,
      })
    } else {
      submission.status = 'changes_requested'
      submission.currentStepId = 501
      appendEvent(submission.id, user, {
        eventType: 'changes_requested',
        title: 'Changes requested',
        detail: input.feedback,
        createdAt: now,
      })
    }
    emit('submission.updated')
    return structuredClone(submission)
  },

  async initiatePayout(user: User, submissionId: number): Promise<Payout> {
    assertRole(user, 'finance', 'admin')
    await sleep(650)
    const submission = state.submissions.find((item) => item.id === submissionId)
    if (!submission || submission.status !== 'awaiting_finance') {
      throw new Error('This submission is no longer awaiting finance approval.')
    }

    const now = new Date().toISOString()
    const payout: Payout = {
      id: nextId(state.payouts),
      submissionId,
      learnerId: submission.learnerId,
      learnerName: submission.learnerName,
      milestoneTitle: submission.milestoneTitle,
      amount: submission.amount,
      currency: demoCohort.currency,
      provider: 'paystack-test',
      providerReference: `msr_test_${submission.id}_${Date.now()}`,
      status: 'processing',
      approvedAt: now,
      paidAt: null,
    }
    state.payouts = [payout, ...state.payouts]
    submission.status = 'processing'
    submission.payoutStatus = 'processing'
    submission.currentStepId = 504
    submission.updatedAt = now
    appendEvent(submission.id, user, {
      eventType: 'finance_approved',
      title: 'Stipend authorized',
      detail: `${user.name} approved the eligibility and budget checks.`,
      createdAt: now,
    })
    appendEvent(submission.id, null, {
      eventType: 'payout_queued',
      title: 'Test payout queued',
      detail: 'Sub0 handed the transfer to Paystack test mode with retry protection.',
      createdAt: now,
    })
    emit('payout.updated')

    window.setTimeout(() => {
      const completedAt = new Date().toISOString()
      payout.status = 'paid'
      payout.paidAt = completedAt
      submission.status = 'paid'
      submission.payoutStatus = 'paid'
      submission.currentStepId = 505
      submission.updatedAt = completedAt
      appendEvent(submission.id, null, {
        actorName: 'Paystack test',
        actorRole: 'provider',
        eventType: 'payout_paid',
        title: 'Test payout confirmed',
        detail: `Signed webhook confirmed ${payout.currency} ${payout.amount.toLocaleString()} as paid.`,
        createdAt: completedAt,
        metadata: { providerReference: payout.providerReference },
      })
      emit('payout.updated')
    }, 1_400)

    return structuredClone(payout)
  },

  async saveWorkflow(user: User, steps: WorkflowStep[]): Promise<WorkflowStep[]> {
    assertRole(user, 'admin')
    await sleep(500)
    state.workflow = steps
      .map((step, index) => ({ ...step, position: index + 1 }))
      .sort((a, b) => a.position - b.position)
    emit('workflow.updated')
    return structuredClone(state.workflow)
  },

  subscribe(listener: (event: StoreEvent) => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  userById(id: number) {
    return findUser(id)
  },

  reset() {
    state = freshState()
    emit('submission.updated')
  },
}
