import { describe, expect, it } from 'vitest'
import { calculateFlip7Score, evaluateFlip7Completion, type Flip7CardDefinition } from './flip7Scoring'

const definitions: Flip7CardDefinition[] = [
  ...Array.from({ length: 8 }, (_, value) => ({
    cardKind: 'number' as const,
    code: `number_${value}`,
    numericValue: value,
  })),
  { cardKind: 'additive', code: 'modifier_plus_4', numericValue: 4 },
  { cardKind: 'multiplier', code: 'modifier_x2', numericValue: null },
  { cardKind: 'action', code: 'action_freeze', numericValue: null },
]

describe('Flip 7 scoring', () => {
  it('applies number subtotal, multiplier, additive modifier, then seven bonus', () => {
    const score = calculateFlip7Score(
      ['number_0', 'number_1', 'number_2', 'number_3', 'number_4', 'number_5', 'number_6', 'modifier_x2', 'modifier_plus_4'],
      definitions,
    )

    expect(score).toMatchObject({
      additivePoints: 4,
      distinctNumberCount: 7,
      hasMultiplier: true,
      numberSubtotal: 21,
      points: 61,
    })
  })

  it('scores a bust as zero even when modifiers are present', () => {
    const score = calculateFlip7Score(['number_5', 'number_5', 'modifier_x2', 'modifier_plus_4'], definitions)
    expect(score.busted).toBe(true)
    expect(score.points).toBe(0)
  })

  it('ignores action cards for numeric scoring and rejects unknown cards', () => {
    expect(calculateFlip7Score(['number_7', 'action_freeze'], definitions).points).toBe(7)
    expect(() => calculateFlip7Score(['not_a_card'], definitions)).toThrow(/Unknown Flip 7 card/)
  })

  it('rejects multiple multipliers instead of silently changing the rules', () => {
    expect(() => calculateFlip7Score(['modifier_x2', 'modifier_x2'], definitions)).toThrow(/at most one multiplier/)
  })

  it('completes only when the 200-point leader is unique', () => {
    expect(evaluateFlip7Completion([
      { participantId: 'p1', total: 205 },
      { participantId: 'p2', total: 198 },
    ])).toEqual({ completed: true, maxTotal: 205, winnerParticipantIds: ['p1'] })

    expect(evaluateFlip7Completion([
      { participantId: 'p1', total: 205 },
      { participantId: 'p2', total: 205 },
    ])).toEqual({ completed: false, maxTotal: 205, winnerParticipantIds: ['p1', 'p2'] })
  })
})
