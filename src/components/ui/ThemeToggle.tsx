import { useTheme } from '../../themes/ThemeProvider'
import styles from './ThemeToggle.module.css'

export function ThemeToggle() {
  const { resolvedMode, toggleMode } = useTheme()
  const nextMode = resolvedMode === 'dark' ? 'light' : 'dark'

  return (
    <button
      aria-label={`Switch to ${nextMode} mode`}
      className={styles.button}
      onClick={toggleMode}
      title={`Switch to ${nextMode} mode`}
      type="button"
    >
      <span aria-hidden="true" className={styles.icon}>{resolvedMode === 'dark' ? '☀' : '☾'}</span>
      <span className={styles.label}>{resolvedMode === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}
