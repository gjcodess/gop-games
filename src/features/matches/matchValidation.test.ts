import { describe, expect, it } from 'vitest'
import { getGameDefinition } from '../games/gameRegistry'
import { assertMatchTransition, canTransitionMatch, isTerminalMatchStatus } from './matchLifecycle'
import { validateCompletedResult, validateMatchSetup } from './matchValidation'
import type { MatchSetupDraft } from './matchTypes'

const binaryGame = getGameDefinition('uno')!
const mooseMaster = getGameDefinition('moose-master')!

function setupDraft(overrides: Partial<MatchSetupDraft> = {}): MatchSetupDraft {
  return {
    game: binaryGame,
    participants: [
      { profileId: 'p1', seatOrder: 1 },
      { profileId: 'p2', seatOrder: 2 },
    ],
    ...overrides,
  }
}

describe('match architecture', () => {
  it('allows only intentional lifecycle transitions', () => {
    expect(canTransitionMatch('setup', 'active')).toBe(true)
    expect(canTransitionMatch('completed', 'active')).toBe(false)
    expect(isTerminalMatchStatus('archived')).toBe(true)
    expect(() => assertMatchTransition('setup', 'completed')).toThrow(/Invalid match transition/)
  })

  it('normalizes singleton teams and rejects missing participants', () => {
    expect(validateMatchSetup(setupDraft())).toEqual([])
    expect(validateMatchSetup(setupDraft({ participants: [{ profileId: 'p1', seatOrder: 1 }] }))[0]?.code).toBe('too_few_players')
  })

  it('supports multiple winners only when the game allows them', () => {
    const results = [
      { outcome: 'win' as const, teamId: 'team-a' },
      { outcome: 'win' as const, teamId: 'team-b' },
    ]

    expect(validateCompletedResult(binaryGame, results).map((issue) => issue.code)).toContain('invalid_winner_count')
    expect(validateCompletedResult(mooseMaster, results)).toEqual([])
  })
})
