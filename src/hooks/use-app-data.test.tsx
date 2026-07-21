import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from '../auth/auth-context'
import { demoStore } from '../mocks/demo-store'
import type { Role } from '../types'
import { queryKeys, useDashboard, useRealtimeSync } from './use-app-data'

const SESSION_KEY = 'milestonerail.session'

function DashboardProbe() {
  const { session, quickSignIn } = useAuth()
  const dashboard = useDashboard()
  useRealtimeSync()

  const amaraCapstone = dashboard.data?.submissions.find((submission) => submission.id === 402)
  const amaraEvent = dashboard.data?.events.find((event) => event.submissionId === 402)

  return (
    <div>
      <p data-testid="role">{session?.user.role}</p>
      <p data-testid="submission-count">
        {dashboard.data ? dashboard.data.submissions.length : 'Loading'}
      </p>
      <p data-testid="amara-status">{amaraCapstone?.status || 'Missing'}</p>
      <p data-testid="amara-event">{amaraEvent?.eventType || 'No event'}</p>
      <button type="button" onClick={() => quickSignIn('finance')}>
        Switch to Finance
      </button>
    </div>
  )
}

function renderDashboard(role: Role) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoStore.sessionForRole(role)))
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DashboardProbe />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { queryClient, ...view }
}

beforeEach(() => {
  sessionStorage.clear()
  demoStore.reset()
})

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  demoStore.reset()
})

describe('application data queries and realtime synchronization', () => {
  it('keys dashboards by user when a demo role changes', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderDashboard('learner')

    await waitFor(() => expect(screen.getByTestId('submission-count')).toHaveTextContent('2'))
    expect(queryClient.getQueryData([...queryKeys.dashboard, 101])).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Switch to Finance' }))

    await waitFor(() => expect(screen.getByTestId('submission-count')).toHaveTextContent('4'))
    expect(screen.getByTestId('role')).toHaveTextContent('finance')
    expect(queryClient.getQueryData([...queryKeys.dashboard, 101])).toBeDefined()
    expect(queryClient.getQueryData([...queryKeys.dashboard, 103])).toBeDefined()
  })

  it('invalidates and refetches an active dashboard after a realtime store event', async () => {
    renderDashboard('learner')
    await waitFor(() => expect(screen.getByTestId('amara-status')).toHaveTextContent('draft'))

    await act(async () => {
      await demoStore.submitEvidence(demoStore.sessionForRole('learner').user, {
        submissionId: 402,
        evidenceUrl: 'https://example.com/realtime-capstone',
        note: 'Realtime test evidence with enough context for mentor review.',
      })
    })

    await waitFor(() => expect(screen.getByTestId('amara-status')).toHaveTextContent('submitted'))
    expect(screen.getByTestId('amara-event')).toHaveTextContent('evidence_submitted')
  })
})
