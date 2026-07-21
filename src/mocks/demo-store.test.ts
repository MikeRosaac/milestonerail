import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStore } from './demo-store'

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown }

async function resolveAfter<T>(promise: Promise<T>, milliseconds: number) {
  const settled: Promise<Settled<T>> = promise.then(
    (value) => ({ ok: true, value }),
    (error: unknown) => ({ ok: false, error }),
  )
  await vi.advanceTimersByTimeAsync(milliseconds)
  const result = await settled
  if (!result.ok) throw result.error
  return result.value
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-21T12:00:00.000Z'))
  demoStore.reset()
})

afterEach(() => {
  demoStore.reset()
  vi.useRealTimers()
})

describe('demoStore authentication and data visibility', () => {
  it('authenticates configured demo accounts and rejects invalid credentials', async () => {
    const session = await resolveAfter(
      demoStore.signIn('amara@demo.milestonerail.app', 'demo2026'),
      350,
    )

    expect(session).toMatchObject({
      token: 'demo.learner.101',
      user: {
        id: 101,
        name: 'Amara Okafor',
        role: 'learner',
      },
      expiresAt: '2026-07-21T20:00:00.350Z',
    })

    await expect(
      resolveAfter(demoStore.signIn('amara@demo.milestonerail.app', 'wrong-password'), 350),
    ).rejects.toThrow('Use the demo password: demo2026')
    await expect(
      resolveAfter(demoStore.signIn('missing@demo.milestonerail.app', 'demo2026'), 350),
    ).rejects.toThrow('No demo account matches that email.')
  })

  it('limits a learner dashboard to that learner while operational roles see the cohort', async () => {
    const learner = demoStore.sessionForRole('learner').user
    const mentor = demoStore.sessionForRole('mentor').user

    const learnerDashboard = await resolveAfter(demoStore.dashboard(learner), 180)
    const mentorDashboard = await resolveAfter(demoStore.dashboard(mentor), 180)

    expect(learnerDashboard.submissions.map((submission) => submission.id)).toEqual([401, 402])
    expect(learnerDashboard.payouts.map((payout) => payout.submissionId)).toEqual([401])
    expect(learnerDashboard.events.every((event) => [401, 402].includes(event.submissionId))).toBe(
      true,
    )
    expect(mentorDashboard.submissions.map((submission) => submission.id)).toEqual([
      401, 402, 403, 404,
    ])
  })
})

describe('demoStore guarded milestone transition', () => {
  it('moves Amara from evidence to a signed-webhook paid record without touching fixtures', async () => {
    const learner = demoStore.sessionForRole('learner').user
    const mentor = demoStore.sessionForRole('mentor').user
    const finance = demoStore.sessionForRole('finance').user
    const notifications: string[] = []
    const unsubscribe = demoStore.subscribe((event) => notifications.push(event))

    const submitted = await resolveAfter(
      demoStore.submitEvidence(learner, {
        submissionId: 402,
        evidenceUrl: 'https://example.com/amara-api-capstone',
        note: 'The deployment link demonstrates authentication, retries, and API error handling.',
      }),
      550,
    )
    expect(submitted).toMatchObject({
      id: 402,
      learnerName: 'Amara Okafor',
      status: 'submitted',
      currentStepId: 502,
      evidenceUrl: 'https://example.com/amara-api-capstone',
    })

    const reviewed = await resolveAfter(
      demoStore.review(mentor, {
        submissionId: 402,
        decision: 'approve',
        feedback: 'The API workflow and failure recovery meet the capstone rubric.',
      }),
      500,
    )
    expect(reviewed).toMatchObject({
      id: 402,
      status: 'awaiting_finance',
      currentStepId: 503,
      reviewerFeedback: 'The API workflow and failure recovery meet the capstone rubric.',
    })

    const payout = await resolveAfter(demoStore.initiatePayout(finance, 402), 650)
    expect(payout).toMatchObject({
      submissionId: 402,
      learnerName: 'Amara Okafor',
      provider: 'paystack-test',
      status: 'processing',
    })
    expect(payout.providerReference).toMatch(/^msr_test_402_\d+$/)
    expect(notifications).toEqual(['submission.updated', 'submission.updated', 'payout.updated'])

    await vi.advanceTimersByTimeAsync(1_399)
    expect(notifications.filter((event) => event === 'payout.updated')).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(notifications.filter((event) => event === 'payout.updated')).toHaveLength(2)

    const dashboard = await resolveAfter(demoStore.dashboard(finance), 180)
    const targetSubmission = dashboard.submissions.find((submission) => submission.id === 402)
    const targetPayout = dashboard.payouts.find((item) => item.submissionId === 402)
    const targetEvents = dashboard.events.filter((event) => event.submissionId === 402)

    expect(targetSubmission).toMatchObject({
      status: 'paid',
      payoutStatus: 'paid',
      currentStepId: 505,
    })
    expect(targetPayout).toMatchObject({
      status: 'paid',
      providerReference: payout.providerReference,
    })
    expect(targetEvents.map((event) => event.eventType)).toEqual([
      'payout_paid',
      'payout_queued',
      'finance_approved',
      'mentor_approved',
      'evidence_submitted',
    ])
    expect(targetEvents[0]).toMatchObject({
      actorName: 'Paystack test',
      actorRole: 'provider',
      title: 'Test payout confirmed',
      metadata: { providerReference: payout.providerReference },
    })
    expect(dashboard.submissions.find((submission) => submission.id === 403)?.status).toBe(
      'submitted',
    )
    expect(dashboard.submissions.find((submission) => submission.id === 404)?.status).toBe(
      'awaiting_finance',
    )

    unsubscribe()
  })

  it('enforces role ownership and current-state guards', async () => {
    const learner = demoStore.sessionForRole('learner').user
    const mentor = demoStore.sessionForRole('mentor').user
    const finance = demoStore.sessionForRole('finance').user

    await expect(
      demoStore.submitEvidence(mentor, {
        submissionId: 402,
        evidenceUrl: 'https://example.com/not-allowed',
        note: 'A mentor must not submit learner evidence.',
      }),
    ).rejects.toThrow('This action requires the learner role.')
    await expect(
      demoStore.review(finance, {
        submissionId: 403,
        decision: 'approve',
        feedback: 'Finance cannot perform mentor approval.',
      }),
    ).rejects.toThrow('This action requires the mentor or admin role.')
    await expect(demoStore.initiatePayout(mentor, 404)).rejects.toThrow(
      'This action requires the finance or admin role.',
    )

    await expect(
      resolveAfter(
        demoStore.submitEvidence(learner, {
          submissionId: 403,
          evidenceUrl: 'https://example.com/kwame',
          note: 'Amara cannot submit evidence for another learner.',
        }),
        550,
      ),
    ).rejects.toThrow('Submission not found for this learner.')
    await expect(
      resolveAfter(
        demoStore.submitEvidence(learner, {
          submissionId: 401,
          evidenceUrl: 'https://example.com/already-paid',
          note: 'Paid evidence cannot be submitted a second time.',
        }),
        550,
      ),
    ).rejects.toThrow('This milestone has already been submitted.')
    await expect(
      resolveAfter(
        demoStore.review(mentor, {
          submissionId: 404,
          decision: 'approve',
          feedback: 'This record is already waiting for finance.',
        }),
        500,
      ),
    ).rejects.toThrow('This submission is no longer awaiting mentor review.')
    await expect(resolveAfter(demoStore.initiatePayout(finance, 403), 650)).rejects.toThrow(
      'This submission is no longer awaiting finance approval.',
    )
  })
})

describe('demoStore workflow persistence', () => {
  it('persists an admin reorder with normalized positions and emits realtime updates', async () => {
    const admin = demoStore.sessionForRole('admin').user
    const mentor = demoStore.sessionForRole('mentor').user
    const original = await resolveAfter(demoStore.workflow(), 120)
    const reordered = [
      original[0],
      { ...original[2], position: 99 },
      { ...original[1], position: -1 },
      ...original.slice(3),
    ]
    const notifications: string[] = []
    const unsubscribe = demoStore.subscribe((event) => notifications.push(event))

    await expect(demoStore.saveWorkflow(mentor, reordered)).rejects.toThrow(
      'This action requires the admin role.',
    )

    const saved = await resolveAfter(demoStore.saveWorkflow(admin, reordered), 500)
    expect(saved.map((step) => step.id)).toEqual([501, 503, 502, 504, 505])
    expect(saved.map((step) => step.position)).toEqual([1, 2, 3, 4, 5])
    expect(notifications).toEqual(['workflow.updated'])

    saved[1].label = 'Client-only mutation'
    const persisted = await resolveAfter(demoStore.workflow(), 120)
    expect(persisted.map((step) => step.id)).toEqual([501, 503, 502, 504, 505])
    expect(persisted[1].label).toBe('Finance approval')

    unsubscribe()
  })
})
