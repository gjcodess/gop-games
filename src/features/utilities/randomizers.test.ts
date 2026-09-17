import { describe, expect, it } from 'vitest'
import { assignTeams, flipCoin, pickOddOneOut, pickRandom, shuffle } from './randomizers'

describe('game-night randomizers', () => {
  it('shuffles without mutating the input', () => {
    const input = ['A', 'B', 'C', 'D']
    expect(shuffle(input, () => 0)).toEqual(['B', 'C', 'D', 'A'])
    expect(input).toEqual(['A', 'B', 'C', 'D'])
  })

  it('deals balanced teams and preserves every player once', () => {
    const teams = assignTeams(['A', 'B', 'C', 'D', 'E'], 2, () => 0.5)
    expect(teams).toHaveLength(2)
    expect(teams.map((team) => team.length)).toEqual([3, 2])
    expect(teams.flat().sort()).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('supports deterministic coin, person, and validation outcomes', () => {
    expect(flipCoin(() => 0)).toBe('heads')
    expect(flipCoin(() => 0.99)).toBe('tails')
    expect(pickRandom(['A', 'B'], () => 0.99)).toBe('B')
    expect(pickOddOneOut(['A', 'B'], () => 0)).toBe('A')
    expect(() => assignTeams(['A'], 2, () => 0)).toThrow(/at least one player/i)
    expect(() => pickRandom([], () => 0)).toThrow(/empty list/i)
  })
})
