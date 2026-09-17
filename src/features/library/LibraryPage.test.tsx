import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../themes/ThemeProvider'
import { LibraryPage } from './LibraryPage'

vi.mock('../../lib/supabase/client', () => ({ supabase: {} }))
vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: () => ({
    profile: { id: 'glenn', display_name: 'Glenn' },
    signOut: vi.fn(),
    user: { email: 'glenn@example.test' },
  }),
}))
vi.mock('../../lib/supabase/library', () => ({
  derivePlayerStats: () => [{ displayName: 'Glenn', draws: 0, gamesPlayed: 1, losses: 0, noContests: 0, profileId: 'glenn', winRate: 100, wins: 1 }],
  fetchCompletedMatchHistory: vi.fn().mockResolvedValue([{
    completedAt: '2026-01-02T00:00:00Z',
    createdAt: '2026-01-02T00:00:00Z',
    gameName: 'Uno',
    gameSlug: 'uno',
    id: 'match-1',
    notes: null,
    participants: [{ displayName: 'Glenn', outcome: 'win', placement: 1, profileId: 'glenn', teamName: 'Glenn' }],
  }]),
  fetchPublishedRules: vi.fn().mockResolvedValue([{
    document: { game_id: 'game-1', id: 'doc-1', variant_id: null },
    game: { description: 'Classic card play.', id: 'game-1', name: 'Uno' },
    revision: { description: 'Uno rules.', objective: 'Empty your hand.', scoring_rules: 'Record the winner.', setup: 'Deal cards.', special_rules: [], status: 'published', updated_at: '2026-01-02T00:00:00Z', version: 1, winning_conditions: 'The first player out wins.', published_at: '2026-01-02T00:00:00Z' },
    variant: null,
  }]),
  specialRulesAsText: (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [],
}))

describe('LibraryPage', () => {
  it('loads rules, records, and filters the library search', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ThemeProvider>
          <LibraryPage />
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Uno' })).toBeInTheDocument()
    expect(screen.getByText('Empty your hand.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /match history/i })).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox'), 'Flip 7')

    expect(screen.getByText(/no rules match that search/i)).toBeInTheDocument()
  })
})
