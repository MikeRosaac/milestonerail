export type Role = 'learner' | 'mentor' | 'finance' | 'admin'

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'mentor_approved'
  | 'awaiting_finance'
  | 'processing'
  | 'paid'
  | 'failed'

export type PayoutStatus = 'not_started' | 'queued' | 'processing' | 'paid' | 'failed'

export type WorkflowStepType = 'evidence' | 'approval' | 'payout' | 'receipt'

export interface User {
  id: number
  organizationId: number
  name: string
  email: string
  role: Role
  avatarUrl?: string
}

export interface Session {
  token: string
  user: User
  expiresAt: string
}

export interface Cohort {
  id: number
  organizationId: number
  name: string
  programName: string
  location: string
  startDate: string
  endDate: string
  currency: string
  budget: number
  committed: number
  disbursed: number
  learnerCount: number
}

export interface Milestone {
  id: number
  cohortId: number
  title: string
  description: string
  dueAt: string
  amount: number
  evidenceHint: string
  order: number
}

export interface WorkflowStep {
  id: number
  cohortId: number
  label: string
  description: string
  type: WorkflowStepType
  role: Role | 'system'
  position: number
  slaHours: number | null
  active: boolean
}

export interface Submission {
  id: number
  milestoneId: number
  learnerId: number
  learnerName: string
  milestoneTitle: string
  cohortName: string
  evidenceUrl: string | null
  evidenceFileName: string | null
  evidenceNote: string
  status: SubmissionStatus
  currentStepId: number
  submittedAt: string | null
  updatedAt: string
  dueAt: string
  reviewerFeedback: string | null
  amount: number
  payoutStatus: PayoutStatus
}

export interface Payout {
  id: number
  submissionId: number
  learnerId: number
  learnerName: string
  milestoneTitle: string
  amount: number
  currency: string
  provider: 'paystack-test'
  providerReference: string | null
  status: PayoutStatus
  approvedAt: string | null
  paidAt: string | null
}

export interface AuditEvent {
  id: number
  submissionId: number
  actorId: number | null
  actorName: string
  actorRole: Role | 'system' | 'provider'
  eventType:
    | 'evidence_submitted'
    | 'changes_requested'
    | 'mentor_approved'
    | 'finance_approved'
    | 'payout_queued'
    | 'payout_paid'
    | 'payout_failed'
    | 'sla_flagged'
  title: string
  detail: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface OrganizationSummary {
  activeLearners: number
  awaitingReview: number
  awaitingFinance: number
  paidThisMonth: number
  atRisk: number
  averageReviewHours: number
  completionRate: number
}

export interface ActivityPoint {
  day: string
  submitted: number
  approved: number
  paid: number
}

export interface DashboardData {
  cohort: Cohort
  summary: OrganizationSummary
  activity: ActivityPoint[]
  submissions: Submission[]
  payouts: Payout[]
  events: AuditEvent[]
}

export interface ApiEnvelope<T> {
  data: T
  requestId?: string
}

export interface ApiErrorShape {
  message: string
  code?: string
  status?: number
  details?: Record<string, unknown>
}
