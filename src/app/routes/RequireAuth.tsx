import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function RequireAuth({ children }: PropsWithChildren) {
  const { isConfigured, isLoading, status } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main aria-busy="true" aria-live="polite">
        <p>Checking your game-night session…</p>
      </main>
    )
  }

  if (!isConfigured) {
    return (
      <main>
        <h1>Supabase setup needed</h1>
        <p>The app is missing its browser-safe Supabase environment variables.</p>
      </main>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
