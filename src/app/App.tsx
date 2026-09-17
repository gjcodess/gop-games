import styles from './App.module.css'

export function App() {
  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>GOP Games</p>
        <span className={styles.phaseBadge}>Phase 2 foundation</span>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.hero} aria-labelledby="welcome-heading">
          <div>
            <p className={styles.kicker}>Game night, synchronized</p>
            <h1 id="welcome-heading">Make every match feel alive.</h1>
            <p className={styles.description}>
              The React foundation is ready. Match setup, realtime scoring, rules, and game-specific experiences will arrive in the next implementation phases.
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
            <h2 id="foundation-heading">Ready for Supabase integration</h2>
          </div>
          <p>Authentication, groups, match data, and realtime subscriptions are intentionally reserved for their dedicated phases.</p>
        </section>
      </main>
    </div>
  )
}
