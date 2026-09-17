import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { fetchProfile, type Profile } from '../../lib/supabase/profile'
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client'

export type AuthStatus = 'loading' | 'unconfigured' | 'signed-out' | 'authenticated' | 'error'

type AuthContextValue = {
  error: string | null
  isConfigured: boolean
  isLoading: boolean
  profile: Profile | null
  refreshProfile: () => Promise<void>
  session: Session | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (displayName: string, email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  status: AuthStatus
  user: User | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readableError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null | undefined>(() => (supabase ? undefined : null))
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async (nextSession: Session) => {
    if (!supabase) {
      return
    }

    setProfileLoading(true)
    try {
      const nextProfile = await fetchProfile(supabase, nextSession.user.id)
      setProfile(nextProfile)
      setError(null)
    } catch (profileError) {
      setProfile(null)
      setError(readableError(profileError))
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      return
    }

    let mounted = true
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession)
        setError(null)
        if (!nextSession) {
          setProfile(null)
          setProfileLoading(false)
        } else {
          void loadProfile(nextSession)
        }
      }
    })

    void supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (!mounted) {
        return
      }

      if (sessionError) {
        setError(readableError(sessionError))
        setSession(null)
        return
      }

      setSession(sessionData.session)
      if (sessionData.session) {
        void loadProfile(sessionData.session)
      }
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null)
      return
    }

    await loadProfile(session)
  }, [loadProfile, session])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured for this environment.')
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      throw signInError
    }
  }, [])

  const signUp = useCallback(async (displayName: string, email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured for this environment.')
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    if (signUpError) {
      throw signUpError
    }

    return { requiresEmailConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) {
      return
    }

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      throw signOutError
    }
  }, [])

  const status: AuthStatus = !isSupabaseConfigured
    ? 'unconfigured'
    : session === undefined || profileLoading
      ? 'loading'
      : error && !session
        ? 'error'
        : session
          ? 'authenticated'
          : 'signed-out'

  const value = useMemo<AuthContextValue>(() => ({
    error,
    isConfigured: isSupabaseConfigured,
    isLoading: status === 'loading',
    profile,
    refreshProfile,
    session: session ?? null,
    signIn,
    signUp,
    signOut,
    status,
    user: session?.user ?? null,
  }), [error, profile, refreshProfile, session, signIn, signOut, signUp, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.')
  }

  return context
}
