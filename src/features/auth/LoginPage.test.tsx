import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../app/providers/AuthProvider'
import { LoginPage } from './LoginPage'

vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}))

const signIn = vi.fn()
const signUp = vi.fn()

describe('LoginPage account modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signUp.mockResolvedValue({ requiresEmailConfirmation: true })
    vi.mocked(useAuth).mockReturnValue({
      error: null,
      isConfigured: true,
      isLoading: false,
      profile: null,
      refreshProfile: vi.fn().mockResolvedValue(undefined),
      session: null,
      signIn,
      signUp,
      signOut: vi.fn().mockResolvedValue(undefined),
      status: 'signed-out',
      user: null,
    })
  })

  it('creates an account and explains email confirmation', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /create an account/i }))
    await user.type(screen.getByLabelText('Display name'), 'Glenn')
    await user.type(screen.getByLabelText('Email address'), 'glenn@example.com')
    await user.type(screen.getByLabelText('Password'), 'safe-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(signUp).toHaveBeenCalledWith('Glenn', 'glenn@example.com', 'safe-password')
    expect(await screen.findByRole('status')).toHaveTextContent(/check your email/i)
  })
})
