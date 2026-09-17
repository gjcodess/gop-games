import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { ThemeSelector } from '../../components/ui/ThemeSelector'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { supabase } from '../../lib/supabase/client'
import { updateProfile } from '../../lib/supabase/profile'
import styles from './Dashboard.module.css'

export function DashboardPage() {
  const { profile, refreshProfile, signOut, user } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !profile) {
      return
    }

    setIsSaving(true)
    setMessage(null)
    try {
      await updateProfile(supabase, profile.id, { displayName })
      await refreshProfile()
      setMessage('Profile saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}><span className={styles.brandMark}>GOP Games</span> / Game room</p>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <button className={styles.signOut} disabled={isSigningOut} onClick={() => void handleSignOut()} type="button">
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.hero} aria-labelledby="dashboard-heading">
          <p className={styles.eyebrow}>Your game night, connected</p>
          <h1 id="dashboard-heading">Ready when the table is.</h1>
          <p>Authentication and profile persistence are now connected to Supabase. Match setup and realtime game rooms come next.</p>
        </section>

        <div className={styles.controlRow}>
          <section className={styles.profilePanel} aria-labelledby="profile-heading">
            <div>
              <h2 id="profile-heading">Your player profile</h2>
              <p>{user?.email ?? 'Signed-in player'}</p>
            </div>

            {profile ? (
              <form className={styles.profileForm} onSubmit={handleProfileSubmit}>
                <label>
                  Display name
                  <input
                    maxLength={80}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                    value={displayName}
                  />
                </label>
                <button className={styles.saveButton} disabled={isSaving} type="submit">{isSaving ? 'Saving…' : 'Save profile'}</button>
              </form>
            ) : (
              <p>Your profile is still being prepared. Refresh shortly if this message remains.</p>
            )}

            {message && <p className={styles.message} role="status">{message}</p>}
          </section>

          <section className={styles.atmospherePanel} aria-labelledby="atmosphere-heading">
            <h2 id="atmosphere-heading">Set the table mood</h2>
            <p>Game themes are shared visual tokens. A match can take over this atmosphere later without changing its controls.</p>
            <div className={styles.themeSelector}><ThemeSelector /></div>
          </section>
        </div>

        <Link to="/" className={styles.signOut}>Back to home</Link>
      </main>
    </div>
  )
}
