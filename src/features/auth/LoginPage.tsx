import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import styles from './Auth.module.css'

export function LoginPage() {
  const { error: authError, isConfigured, signIn, signUp, status } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFormMessage(null)
    setIsSubmitting(true)

    try {
      if (mode === 'signUp') {
        const result = await signUp(displayName.trim(), email.trim(), password)
        if (result.requiresEmailConfirmation) {
          setFormMessage('Account created. Check your email to confirm your address, then sign in.')
        } else {
          navigate('/app', { replace: true })
        }
      } else {
        await signIn(email.trim(), password)
        navigate('/app', { replace: true })
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : `Unable to ${mode === 'signUp' ? 'create your account' : 'sign in'}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.panel} aria-labelledby="login-heading">
        <p className={styles.eyebrow}>GOP Games</p>
        <h1 className={styles.title} id="login-heading">{mode === 'signUp' ? 'Join the table.' : 'Welcome back.'}</h1>
        <p className={styles.description}>
          {mode === 'signUp'
            ? 'Create your player account to keep your game-night history and live matches connected.'
            : 'Sign in to keep your game-night history and live matches connected.'}
        </p>

        {!isConfigured && (
          <p className={styles.notice} role="status">
            This environment is missing Supabase configuration. The form is ready for a configured deployment.
          </p>
        )}

        {formMessage && <p className={styles.success} role="status">{formMessage}</p>}

        {(formError || authError) && (
          <p className={styles.error} role="alert">{formError ?? authError}</p>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'signUp' && (
            <label className={styles.field}>
              Display name
              <input
                autoComplete="name"
                disabled={!isConfigured || isSubmitting}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                type="text"
                value={displayName}
              />
            </label>
          )}

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
            {isSubmitting ? (mode === 'signUp' ? 'Creating account…' : 'Signing in…') : (mode === 'signUp' ? 'Create account' : 'Sign in')}
          </button>
        </form>

        <p className={styles.modePrompt}>
          {mode === 'signUp' ? 'Already have an account?' : 'New to GOP Games?'}{' '}
          <button
            className={styles.modeButton}
            disabled={isSubmitting}
            onClick={() => {
              setMode(mode === 'signUp' ? 'signIn' : 'signUp')
              setFormError(null)
              setFormMessage(null)
              setShowPassword(false)
            }}
            type="button"
          >
            {mode === 'signUp' ? 'Sign in' : 'Create an account'}
          </button>
        </p>

        <Link className={styles.footerLink} to="/">Back to the game-night home</Link>
      </section>
    </main>
  )
}
