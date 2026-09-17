import { describe, expect, it } from 'vitest'
import { GAME_REGISTRY, getGameDefinition, listGamesByScoringModel } from './gameRegistry'

describe('game registry', () => {
  it('contains every initial game and preserves Moose Master multi-winner rules', () => {
    expect(GAME_REGISTRY).toHaveLength(14)
    expect(getGameDefinition('moose-master')).toMatchObject({ maxWinners: 2, minPlayers: 3 })
  })

  it('keeps billiards variants under one scoring model', () => {
    const billiards = getGameDefinition('billiards')

    expect(billiards?.scoringModel).toBe('billiards')
    expect(billiards?.allowsTeams).toBe(true)
    expect(billiards?.variants?.map((variant) => variant.slug)).toEqual([
      '8-ball',
      '15-ball-consecutive',
      'cutthroat',
    ])
  })

  it('can filter games by scoring model without duplicating game definitions', () => {
    expect(listGamesByScoringModel('binary')).toHaveLength(12)
    expect(listGamesByScoringModel('flip7')).toHaveLength(1)
    expect(listGamesByScoringModel('billiards')).toHaveLength(1)
  })
})
