import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import styles from './Auth.module.css'

export function LoginPage() {
  const { error: authError, isConfigured, signIn, status } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      await signIn(email.trim(), password)
      navigate('/app', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.panel} aria-labelledby="login-heading">
        <p className={styles.eyebrow}>GOP Games</p>
        <h1 className={styles.title} id="login-heading">Welcome back.</h1>
        <p className={styles.description}>Sign in to keep your game-night history and live matches connected.</p>

        {!isConfigured && (
          <p className={styles.notice} role="status">
            This environment is missing Supabase configuration. The form is ready for a configured deployment.
          </p>
        )}

        {(formError || authError) && (
          <p className={styles.error} role="alert">{formError ?? authError}</p>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            Email address
            <input
              autoComplete="email"
              disabled={!isConfigured || isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <div className={styles.passwordRow}>
            <label className={styles.field}>
              Password
              <input
                autoComplete="current-password"
                disabled={!isConfigured || isSubmitting}
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
            </label>
            <button
              className={styles.visibilityButton}
              disabled={isSubmitting}
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button className={styles.primaryButton} disabled={!isConfigured || isSubmitting} type="submit">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link className={styles.footerLink} to="/">Back to the game-night home</Link>
      </section>
    </main>
  )
}
