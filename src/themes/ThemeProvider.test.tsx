import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ThemeSelector } from '../components/ui/ThemeSelector'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { ThemeProvider, useTheme } from './ThemeProvider'

function ThemeState() {
  const { gameTheme, mode, resolvedMode } = useTheme()
  return <output data-testid="theme-state">{`${gameTheme}:${mode}:${resolvedMode}`}</output>
}

describe('ThemeProvider', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('applies the default semantic theme and toggles color mode', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeState />
        <ThemeToggle />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme-state')).toHaveTextContent('default:system:light')
    expect(document.documentElement.dataset.gameTheme).toBe('default')

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }))

    expect(screen.getByTestId('theme-state')).toHaveTextContent('default:dark:dark')
    expect(document.documentElement.dataset.themeMode).toBe('dark')
    expect(window.localStorage.getItem('gop-games:theme-mode')).toBe('dark')
  })

  it('persists a selected game atmosphere without changing shared controls', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeState />
        <ThemeSelector />
      </ThemeProvider>,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /table atmosphere/i }), 'billiards')

    expect(screen.getByTestId('theme-state')).toHaveTextContent('billiards:system:light')
    expect(document.documentElement.dataset.gameTheme).toBe('billiards')
    expect(window.localStorage.getItem('gop-games:game-theme')).toBe('billiards')
  })
})
