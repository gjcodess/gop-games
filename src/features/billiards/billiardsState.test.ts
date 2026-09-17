import { describe, expect, it } from 'vitest'
import {
  createInitialBilliardsBalls,
  getBilliardsBallLabel,
  isValidBilliardsBallNumber,
  validateAssignmentSet,
} from './billiardsState'

describe('billiards state', () => {
  it('creates the fifteen-ball table with every ball on the table', () => {
    const balls = createInitialBilliardsBalls()
    expect(balls).toHaveLength(15)
    expect(balls.every((ball) => ball.state === 'on_table')).toBe(true)
    expect(balls.at(-1)?.ballNumber).toBe(15)
  })

  it('validates ball numbers and gives the 8-ball an accessible label', () => {
    expect(isValidBilliardsBallNumber(1)).toBe(true)
    expect(isValidBilliardsBallNumber(15)).toBe(true)
    expect(isValidBilliardsBallNumber(0)).toBe(false)
    expect(isValidBilliardsBallNumber(1.5)).toBe(false)
    expect(getBilliardsBallLabel(8)).toBe('8-ball')
  })

  it('rejects duplicate balls across flexible team assignments', () => {
    expect(validateAssignmentSet([
      { ballNumbers: [1, 2, 3], teamId: 'team-a' },
      { ballNumbers: [4, 5], teamId: 'team-b' },
    ])).toBeNull()
    expect(validateAssignmentSet([
      { ballNumbers: [1, 2], teamId: 'team-a' },
      { ballNumbers: [2, 3], teamId: 'team-b' },
    ])).toMatch(/Ball 2/)
  })
})
