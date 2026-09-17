import { Component, type PropsWithChildren } from 'react'
import styles from './AppErrorBoundary.module.css'

type AppErrorBoundaryState = { hasError: boolean }

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch() {
    // Keep the fallback user-facing and avoid logging private match payloads.
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className={styles.fallback} id="main-content">
        <p className={styles.eyebrow}>The table needs a reset</p>
        <h1>That screen stumbled.</h1>
        <p>Nothing was lost. Reload the game room and try that action again.</p>
        <button onClick={() => window.location.reload()} type="button">Reload game room</button>
      </main>
    )
  }
}
