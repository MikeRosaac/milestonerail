/* oxlint-disable react/only-export-components -- the provider and hook share one private context */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getApiClient, isDemoMode } from '../lib/api'
import type { Role, Session } from '../types'

const SESSION_KEY = 'milestonerail.session'

interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  isDemo: boolean
  signIn: (email: string, password: string) => Promise<void>
  quickSignIn: (role: Role) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): Session | null {
  const stored = sessionStorage.getItem(SESSION_KEY)
  if (!stored) return null
  try {
    const session = JSON.parse(stored) as Session
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)

  const persist = useCallback((nextSession: Session | null) => {
    setSession(nextSession)
    if (nextSession) sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    else sessionStorage.removeItem(SESSION_KEY)
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      persist(await getApiClient().signIn(email, password))
    },
    [persist],
  )

  const quickSignIn = useCallback(
    (role: Role) => {
      if (!isDemoMode) throw new Error('Quick sign-in is disabled outside local demo mode.')
      persist(getApiClient().sessionForRole(role))
    },
    [persist],
  )

  const signOut = useCallback(() => persist(null), [persist])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isDemo: isDemoMode,
      signIn,
      quickSignIn,
      signOut,
    }),
    [session, signIn, quickSignIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
