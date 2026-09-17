import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from '../themes/ThemeProvider'

vi.mock('../lib/supabase/client', () => ({
  isSupabaseConfigured: false,
  supabase: null,
}))

describe('App foundation', () => {
  it('renders the public landing shell with an auth entry point', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /make every match feel alive/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})
