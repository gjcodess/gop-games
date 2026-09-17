import { describe, expect, it } from 'vitest'
import { derivePlayerStats, specialRulesAsText, type MatchHistoryEntry } from './library'

const history: MatchHistoryEntry[] = [
  {
    completedAt: '2026-01-02T00:00:00Z',
    createdAt: '2026-01-02T00:00:00Z',
    gameName: 'Uno',
    gameSlug: 'uno',
    id: 'match-1',
    notes: null,
    participants: [
      { displayName: 'Glenn', outcome: 'win', placement: 1, profileId: 'glenn', teamName: 'Glenn' },
      { displayName: 'Vherwin', outcome: 'loss', placement: 2, profileId: 'vherwin', teamName: 'Vherwin' },
    ],
  },
  {
    completedAt: '2026-01-03T00:00:00Z',
    createdAt: '2026-01-03T00:00:00Z',
    gameName: 'Moose Master',
    gameSlug: 'moose-master',
    id: 'match-2',
    notes: null,
    participants: [
      { displayName: 'Glenn', outcome: 'win', placement: 1, profileId: 'glenn', teamName: 'Glenn' },
      { displayName: 'Mark Jason', outcome: 'win', placement: 1, profileId: 'mark', teamName: 'Mark Jason' },
    ],
  },
]

describe('library statistics helpers', () => {
  it('counts multiple winners and calculates decided-game win rates', () => {
    const stats = derivePlayerStats(history)
    expect(stats.find((item) => item.profileId === 'glenn')).toMatchObject({ gamesPlayed: 2, wins: 2, winRate: 100 })
    expect(stats.find((item) => item.profileId === 'vherwin')).toMatchObject({ losses: 1, winRate: 0 })
    expect(stats.find((item) => item.profileId === 'mark')).toMatchObject({ wins: 1, winRate: 100 })
  })

  it('filters malformed special-rule payloads instead of rendering objects', () => {
    expect(specialRulesAsText(['Keep the tracker manual.', 42, null])).toEqual(['Keep the tracker manual.'])
    expect(specialRulesAsText({ text: 'not a list' })).toEqual([])
  })
})
