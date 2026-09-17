import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../themes/ThemeProvider'
import { MatchSetupPage } from './MatchSetupPage'

vi.mock('../../lib/supabase/client', () => ({ supabase: null }))
vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: () => ({ profile: null, signOut: vi.fn() }),
}))

describe('MatchSetupPage', () => {
  it('explains when the browser has no Supabase connection', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <MatchSetupPage />
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /who’s playing/i })).toBeInTheDocument()
    expect(screen.getByText(/supabase is not configured/i)).toBeInTheDocument()
  })
})
