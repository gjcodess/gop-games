import { lazy, Suspense, useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { AppErrorBoundary } from '../components/ui/AppErrorBoundary'
import { ScrollProgress } from '../components/ui/ScrollProgress'
import { ScrollToTop } from '../components/ui/ScrollToTop'
import { useAuth } from './providers/AuthProvider'
import { RequireAuth } from './routes/RequireAuth'
import styles from './App.module.css'

const DashboardPage = lazy(async () => import('../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const LibraryPage = lazy(async () => import('../features/library/LibraryPage').then((module) => ({ default: module.LibraryPage })))
const LoginPage = lazy(async () => import('../features/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const MatchRoomPage = lazy(async () => import('../features/matches/MatchRoomPage').then((module) => ({ default: module.MatchRoomPage })))
const MatchSetupPage = lazy(async () => import('../features/matches/MatchSetupPage').then((module) => ({ default: module.MatchSetupPage })))
const UtilitiesPage = lazy(async () => import('../features/utilities/UtilitiesPage').then((module) => ({ default: module.UtilitiesPage })))

const routeTitles: Record<string, string> = {
  '/': 'GOP Games',
  '/app': 'Game room · GOP Games',
  '/app/matches/new': 'New match · GOP Games',
  '/app/library': 'Library · GOP Games',
  '/app/utilities': 'Night tools · GOP Games',
  '/login': 'Sign in · GOP Games',
}

function RouteAccessibility() {
  const location = useLocation()
  const title = routeTitles[location.pathname] ?? 'GOP Games'

  useEffect(() => {
    document.title = title
    if (window.scrollY > 0) window.scrollTo({ behavior: 'auto', top: 0 })
  }, [location.pathname, title])

  return <span aria-live="polite" className="sr-only">{title} loaded</span>
}

function RouteLoading() {
  return <main aria-busy="true" className={styles.routeLoading} id="main-content"><p>Opening the game-night room…</p></main>
}

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
    <>
      <ScrollProgress />
      <RouteAccessibility />
      <AppErrorBoundary>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route element={<LandingPage />} path="/" />
            <Route element={<LoginPage />} path="/login" />
            <Route element={<RequireAuth><DashboardPage /></RequireAuth>} path="/app" />
            <Route element={<RequireAuth><MatchSetupPage /></RequireAuth>} path="/app/matches/new" />
            <Route element={<RequireAuth><MatchRoomPage /></RequireAuth>} path="/app/matches/:matchId" />
            <Route element={<RequireAuth><UtilitiesPage /></RequireAuth>} path="/app/utilities" />
            <Route element={<RequireAuth><LibraryPage /></RequireAuth>} path="/app/library" />
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
      <ScrollToTop />
    </>
  )
}
