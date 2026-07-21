import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { AuthProvider } from './auth/auth-context'
import { demoStore } from './mocks/demo-store'
import type { Role } from './types'

const SESSION_KEY = 'milestonerail.session'

function renderAt(path: string, role?: Role) {
  if (role) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoStore.sessionForRole(role)))
  }
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
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

describe('protected routes and role guards', () => {
  it('redirects an anonymous protected-route visit to sign-in', async () => {
    renderAt('/app/audit')

    expect(await screen.findByRole('heading', { name: 'Welcome to the rail' })).toBeInTheDocument()
  })

  it('redirects a learner away from finance operations to learner milestones', async () => {
    renderAt('/app/payouts', 'learner')

    expect(await screen.findByRole('heading', { name: 'Keep moving, Amara' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Payouts' })).not.toBeInTheDocument()
  })

  it('redirects a mentor away from admin workflow controls to the review queue', async () => {
    renderAt('/app/workflow', 'mentor')

    expect(
      await screen.findByRole('heading', { name: 'Evidence review queue' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Workflow' })).not.toBeInTheDocument()
  })
})
