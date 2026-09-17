import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { isGameThemeKey } from './themeRegistry'
import type { GameThemeKey, ThemeMode } from './themeTypes'

const MODE_STORAGE_KEY = 'gop-games:theme-mode'
const GAME_THEME_STORAGE_KEY = 'gop-games:game-theme'

type ThemeContextValue = {
  gameTheme: GameThemeKey
  mode: ThemeMode
  resolvedMode: 'dark' | 'light'
  setGameTheme: (theme: GameThemeKey) => void
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const stored = window.localStorage.getItem(MODE_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function readGameTheme(): GameThemeKey {
  if (typeof window === 'undefined') {
    return 'default'
  }

  const stored = window.localStorage.getItem(GAME_THEME_STORAGE_KEY)
  return stored && isGameThemeKey(stored) ? stored : 'default'
}

function getSystemMode(): 'dark' | 'light' {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>(readMode)
  const [gameTheme, setGameThemeState] = useState<GameThemeKey>(readGameTheme)
  const [systemMode, setSystemMode] = useState<'dark' | 'light'>(getSystemMode)
  const resolvedMode = mode === 'system' ? systemMode : mode

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemMode(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.themeMode = resolvedMode
    document.documentElement.dataset.gameTheme = gameTheme
    document.documentElement.style.colorScheme = resolvedMode
  }, [gameTheme, resolvedMode])

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode)
    window.localStorage.setItem(MODE_STORAGE_KEY, nextMode)
  }, [])

  const setGameTheme = useCallback((nextTheme: GameThemeKey) => {
    setGameThemeState(nextTheme)
    window.localStorage.setItem(GAME_THEME_STORAGE_KEY, nextTheme)
  }, [])

  const toggleMode = useCallback(() => {
    setMode(resolvedMode === 'dark' ? 'light' : 'dark')
  }, [resolvedMode, setMode])

  const value = useMemo<ThemeContextValue>(() => ({
    gameTheme,
    mode,
    resolvedMode,
    setGameTheme,
    setMode,
    toggleMode,
  }), [gameTheme, mode, resolvedMode, setGameTheme, setMode, toggleMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.')
  }

  return context
}
