import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App foundation', () => {
  it('renders the Phase 2 shell', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /make every match feel alive/i })).toBeInTheDocument()
    expect(screen.getByText(/ready for supabase integration/i)).toBeInTheDocument()
  })
})
