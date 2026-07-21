import { demoStore } from '../mocks/demo-store'
import type {
  ApiEnvelope,
  DashboardData,
  Payout,
  Role,
  Session,
  Submission,
  User,
  WorkflowStep,
} from '../types'

export type RealtimeEvent = 'submission.updated' | 'payout.updated' | 'workflow.updated'

export interface SubmitEvidenceInput {
  submissionId: number
  evidenceUrl?: string
  note: string
  file?: File
}

export interface ReviewInput {
  submissionId: number
  decision: 'approve' | 'changes'
  feedback: string
}

export interface MilestoneRailApi {
  signIn(email: string, password: string): Promise<Session>
  sessionForRole(role: Role): Session
  dashboard(user: User, token: string): Promise<DashboardData>
  workflow(token: string): Promise<WorkflowStep[]>
  submitEvidence(user: User, token: string, input: SubmitEvidenceInput): Promise<Submission>
  review(user: User, token: string, input: ReviewInput): Promise<Submission>
  initiatePayout(user: User, token: string, submissionId: number): Promise<Payout>
  saveWorkflow(user: User, token: string, steps: WorkflowStep[]): Promise<WorkflowStep[]>
  subscribe(session: Session, listener: (event: RealtimeEvent) => void): () => void
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status = 500, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const explicitDemoMode = import.meta.env.VITE_DEMO_MODE
export const isDemoMode =
  explicitDemoMode === 'true' || (import.meta.env.DEV && explicitDemoMode !== 'false')

const demoApi: MilestoneRailApi = {
  signIn: (email, password) => demoStore.signIn(email, password),
  sessionForRole: (role) => demoStore.sessionForRole(role),
  dashboard: (user) => demoStore.dashboard(user),
  workflow: () => demoStore.workflow(),
  submitEvidence: (user, _token, input) =>
    demoStore.submitEvidence(user, {
      submissionId: input.submissionId,
      evidenceUrl: input.evidenceUrl,
      evidenceFileName: input.file?.name,
      note: input.note,
    }),
  review: (user, _token, input) => demoStore.review(user, input),
  initiatePayout: (user, _token, submissionId) => demoStore.initiatePayout(user, submissionId),
  saveWorkflow: (user, _token, steps) => demoStore.saveWorkflow(user, steps),
  subscribe: (_session, listener) => demoStore.subscribe(listener),
}

interface SignInResponse {
  id: number
  organizationId: number
  name: string
  email: string
  role: Role
  token: string
  expiresAt?: string
}

class RealSub0Api implements MilestoneRailApi {
  private readonly baseUrl: string
  private readonly websocketUrl: string

  constructor() {
    const baseUrl = import.meta.env.VITE_SUB0_HTTP_URL
    if (!baseUrl) {
      throw new ApiError(
        'VITE_SUB0_HTTP_URL is required when demo mode is disabled.',
        500,
        'missing_configuration',
      )
    }
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.websocketUrl =
      import.meta.env.VITE_SUB0_WS_URL || `${this.baseUrl.replace(/^http/, 'ws')}/ws`
  }

  private async request<T>(
    resource: string,
    options: RequestInit = {},
    token?: string,
  ): Promise<T> {
    const headers = new Headers(options.headers)
    if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(`${this.baseUrl}/${resource.replace(/^\//, '')}`, {
      ...options,
      headers,
    })

    const body = (await response.json().catch(() => null)) as
      ApiEnvelope<T> | T | { message?: string; code?: string } | null
    if (!response.ok) {
      const errorBody = body as { message?: string; code?: string } | null
      throw new ApiError(
        errorBody?.message || `Sub0 request failed with ${response.status}.`,
        response.status,
        errorBody?.code,
      )
    }

    if (body && typeof body === 'object' && 'data' in body) {
      return (body as ApiEnvelope<T>).data
    }
    return body as T
  }

  async signIn(email: string, password: string): Promise<Session> {
    const response = await this.request<SignInResponse>('auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return {
      token: response.token,
      user: {
        id: response.id,
        organizationId: response.organizationId,
        name: response.name,
        email: response.email,
        role: response.role,
      },
      expiresAt: response.expiresAt || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    }
  }

  sessionForRole(): Session {
    throw new ApiError('Quick role switching is available only in local demo mode.', 400)
  }

  dashboard(_user: User, token: string) {
    return this.request<DashboardData>('dashboard', { method: 'POST', body: '{}' }, token)
  }

  workflow(token: string) {
    return this.request<WorkflowStep[]>('workflows/list', { method: 'POST', body: '{}' }, token)
  }

  async submitEvidence(
    _user: User,
    token: string,
    input: SubmitEvidenceInput,
  ): Promise<Submission> {
    if (input.file) {
      const formData = new FormData()
      formData.set('submission_id', String(input.submissionId))
      formData.set('note', input.note)
      if (input.evidenceUrl) formData.set('evidence_url', input.evidenceUrl)
      formData.set('file', input.file)
      return this.request<Submission>(
        'submissions/evidence-upload',
        { method: 'POST', body: formData },
        token,
      )
    }
    return this.request<Submission>(
      'submissions/evidence-link',
      {
        method: 'POST',
        body: JSON.stringify({
          submission_id: input.submissionId,
          evidence_url: input.evidenceUrl,
          note: input.note,
        }),
      },
      token,
    )
  }

  review(_user: User, token: string, input: ReviewInput) {
    return this.request<Submission>(
      'submissions/review',
      {
        method: 'POST',
        body: JSON.stringify({
          submission_id: input.submissionId,
          decision: input.decision,
          feedback: input.feedback,
        }),
      },
      token,
    )
  }

  initiatePayout(_user: User, token: string, submissionId: number) {
    return this.request<Payout>(
      'payouts/initiate',
      { method: 'POST', body: JSON.stringify({ submission_id: submissionId }) },
      token,
    )
  }

  saveWorkflow(_user: User, token: string, steps: WorkflowStep[]) {
    return this.request<WorkflowStep[]>(
      'workflows/save',
      { method: 'POST', body: JSON.stringify({ steps }) },
      token,
    )
  }

  subscribe(session: Session, listener: (event: RealtimeEvent) => void) {
    let socket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let closed = false
    let reconnectAttempt = 0

    const connect = () => {
      const url = new URL(this.websocketUrl)
      url.searchParams.set('uid', String(session.user.id))
      socket = new WebSocket(url, ['x-access-token', session.token])
      socket.addEventListener('open', () => {
        reconnectAttempt = 0
      })
      socket.addEventListener('message', (message) => {
        try {
          const parsed = JSON.parse(String(message.data)) as { action?: RealtimeEvent }
          if (
            parsed.action === 'submission.updated' ||
            parsed.action === 'payout.updated' ||
            parsed.action === 'workflow.updated'
          ) {
            listener(parsed.action)
          }
        } catch {
          // Ignore provider keepalives or malformed messages.
        }
      })
      socket.addEventListener('close', () => {
        if (closed) return
        reconnectAttempt += 1
        const delay = Math.min(1_000 * 2 ** reconnectAttempt, 15_000)
        reconnectTimer = window.setTimeout(connect, delay)
      })
    }

    connect()
    return () => {
      closed = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }
}

let client: MilestoneRailApi | null = null

export function getApiClient(): MilestoneRailApi {
  if (!client) client = isDemoMode ? demoApi : new RealSub0Api()
  return client
}
