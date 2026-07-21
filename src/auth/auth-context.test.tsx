import { useState } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { demoStore } from '../mocks/demo-store'
import { AuthProvider, useAuth } from './auth-context'
import type { Role, Session } from '../types'

const SESSION_KEY = 'milestonerail.session'

function AuthProbe() {
  const { session, isAuthenticated, isDemo, quickSignIn, signOut } = useAuth()
  const [lastRole, setLastRole] = useState<Role | null>(null)

  function continueAs(role: Role) {
    quickSignIn(role)
    setLastRole(role)
  }

  return (
    <div>
      <p data-testid="session">
        {session ? `${session.user.name} · ${session.user.role}` : 'Signed out'}
      </p>
      <p data-testid="auth-state">
        {isAuthenticated ? 'Authenticated' : 'Anonymous'} · {isDemo ? 'Demo' : 'Live'}
      </p>
      <p data-testid="last-role">{lastRole || 'None'}</p>
      <button type="button" onClick={() => continueAs('finance')}>
        Continue as Finance
      </button>
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  )
}

beforeEach(() => {
  sessionStorage.clear()
  demoStore.reset()
})

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

describe('AuthProvider session persistence', () => {
  it('restores a valid persisted session on mount', () => {
    const session = demoStore.sessionForRole('mentor')
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

    renderProvider()

    expect(screen.getByTestId('session')).toHaveTextContent('David Mensah · mentor')
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated · Demo')
  })

  it('persists quick role sign-in across provider remounts and clears it on sign-out', async () => {
    const user = userEvent.setup()
    const firstRender = renderProvider()

    expect(screen.getByTestId('session')).toHaveTextContent('Signed out')
    await user.click(screen.getByRole('button', { name: 'Continue as Finance' }))

    expect(screen.getByTestId('session')).toHaveTextContent('Fatima Bello · finance')
    expect(screen.getByTestId('last-role')).toHaveTextContent('finance')
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}')).toMatchObject({
      token: 'demo.finance.103',
      user: { role: 'finance' },
    })

    firstRender.unmount()
    renderProvider()
    expect(screen.getByTestId('session')).toHaveTextContent('Fatima Bello · finance')

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(screen.getByTestId('session')).toHaveTextContent('Signed out')
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it.each([
    ['an expired session', JSON.stringify(expiredSession())],
    ['malformed JSON', '{not-json'],
  ])('discards %s instead of authenticating', (_label, storedValue) => {
    sessionStorage.setItem(SESSION_KEY, storedValue)

    renderProvider()

    expect(screen.getByTestId('session')).toHaveTextContent('Signed out')
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Anonymous · Demo')
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })
})

function expiredSession(): Session {
  return {
    ...demoStore.sessionForRole('learner'),
    expiresAt: '2020-01-01T00:00:00.000Z',
  }
}
