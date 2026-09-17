import { GAME_THEME_REGISTRY } from '../../themes/themeRegistry'
import { useTheme } from '../../themes/ThemeProvider'
import styles from './ThemeSelector.module.css'

export function ThemeSelector() {
  const { gameTheme, setGameTheme } = useTheme()
  const selectedTheme = GAME_THEME_REGISTRY.find((theme) => theme.key === gameTheme) ?? GAME_THEME_REGISTRY[0]

  return (
    <label className={styles.field}>
      <span className={styles.label}>Table atmosphere</span>
      <select
        aria-label="Table atmosphere"
        className={styles.select}
        onChange={(event) => setGameTheme(event.target.value as typeof gameTheme)}
        value={gameTheme}
      >
        {GAME_THEME_REGISTRY.map((theme) => <option key={theme.key} value={theme.key}>{theme.label}</option>)}
      </select>
      <span className={styles.description}>{selectedTheme.description}</span>
    </label>
  )
}
