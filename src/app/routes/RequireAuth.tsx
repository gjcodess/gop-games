import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { useAuth } from '../providers/AuthProvider'
import styles from './RequireAuth.module.css'

export function RequireAuth({ children }: PropsWithChildren) {
  const { isConfigured, isLoading, status } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main aria-busy="true" aria-live="polite" className={styles.loading} id="main-content">
        <LoadingSkeleton width="8rem" />
        <LoadingSkeleton className={styles.title} width="min(22rem, 80vw)" />
        <LoadingSkeleton width="min(30rem, 90vw)" />
        <span className={styles.status}>Checking your game-night session…</span>
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
