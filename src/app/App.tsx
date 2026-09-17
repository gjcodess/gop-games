import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { LoginPage } from '../features/auth/LoginPage'
import { UtilitiesPage } from '../features/utilities/UtilitiesPage'
import { useAuth } from './providers/AuthProvider'
import { RequireAuth } from './routes/RequireAuth'
import styles from './App.module.css'

function LandingPage() {
  const { isConfigured, status } = useAuth()
  const destination = status === 'authenticated' ? '/app' : '/login'

  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>GOP Games <span aria-hidden="true">/</span> Game night, connected</p>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Link className={styles.phaseBadge} to={destination}>
            {status === 'authenticated' ? 'Open game room' : 'Sign in'}
          </Link>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.hero} aria-labelledby="welcome-heading">
          <div>
            <p className={styles.kicker}>Game night, synchronized</p>
            <h1 id="welcome-heading">Make every match feel alive.</h1>
            <p className={styles.description}>
              Keep every match, score, and game-night ritual connected. Sign in to unlock your player profile and shared game room.
            </p>
          </div>
          <div className={styles.signal} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className={styles.statusPanel} aria-labelledby="foundation-heading">
          <div>
            <p className={styles.sectionLabel}>Foundation status</p>
            <h2 id="foundation-heading">{isConfigured ? 'Authentication is connected' : 'Ready for Supabase integration'}</h2>
          </div>
          <p>
            {isConfigured
              ? 'Your cloud project is configured. Sign in to continue to your profile.'
              : 'Authentication, groups, match data, and realtime subscriptions are intentionally reserved for their dedicated phases.'}
          </p>
        </section>
      </main>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RequireAuth><DashboardPage /></RequireAuth>} path="/app" />
      <Route element={<RequireAuth><UtilitiesPage /></RequireAuth>} path="/app/utilities" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}
