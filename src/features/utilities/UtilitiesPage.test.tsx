import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../themes/ThemeProvider'
import { UtilitiesPage } from './UtilitiesPage'

vi.mock('../../lib/supabase/client', () => ({ supabase: null }))
vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: () => ({
    profile: { avatar_path: null, display_name: 'Glenn', id: 'profile-glenn' },
    signOut: vi.fn(),
    user: { email: 'glenn@example.test' },
  }),
}))

describe('UtilitiesPage', () => {
  it('exposes the player pool and accessible utility actions', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <UtilitiesPage />
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /settle the little moments/i })).toBeInTheDocument()
    expect(await screen.findByText('Glenn')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByRole('button', { name: /spin the wheel/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /choose the tagger/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /deal teams/i })).toBeDisabled()
  })
})
