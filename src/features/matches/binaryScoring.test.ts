import { describe, expect, it } from 'vitest'
import { getGameDefinition } from '../games/gameRegistry'
import {
  buildBinaryDrawResults,
  buildBinaryNoContestResults,
  buildBinaryWinLossResults,
  getBinaryOutcomeLabel,
} from './binaryScoring'

const uno = getGameDefinition('uno')!
const mooseMaster = getGameDefinition('moose-master')!

describe('binary scoring builders', () => {
  it('builds a single winner with losses for the remaining teams', () => {
    expect(buildBinaryWinLossResults(uno, ['team-a', 'team-b', 'team-c'], ['team-b'])).toEqual({
      issues: [],
      results: [
        { outcome: 'loss', placement: undefined, teamId: 'team-a' },
        { outcome: 'win', placement: 1, teamId: 'team-b' },
        { outcome: 'loss', placement: undefined, teamId: 'team-c' },
      ],
    })
  })

  it('allows Moose Master to produce two winners', () => {
    const result = buildBinaryWinLossResults(mooseMaster, ['team-a', 'team-b', 'team-c'], ['team-a', 'team-c'])
    expect(result.issues).toEqual([])
    expect(result.results.filter((entry) => entry.outcome === 'win')).toHaveLength(2)
  })

  it('supports draws and no-contest results without inventing a winner', () => {
    expect(buildBinaryDrawResults(uno, ['team-a', 'team-b']).issues).toEqual([])
    expect(buildBinaryNoContestResults(uno, ['team-a', 'team-b']).issues).toEqual([])
    expect(getBinaryOutcomeLabel('no_contest')).toBe('No contest')
  })

  it('rejects duplicate or foreign winner IDs before creating a payload', () => {
    expect(() => buildBinaryWinLossResults(uno, ['team-a', 'team-b'], ['team-a', 'team-a'])).toThrow(/duplicate/i)
    expect(() => buildBinaryWinLossResults(uno, ['team-a', 'team-b'], ['team-c'])).toThrow(/belong/i)
  })
})
