import type { GameDefinition } from '../games/gameRegistry'
import { validateCompletedResult, type ValidationIssue } from './matchValidation'
import type { MatchResultDraft } from './matchTypes'

export type BinaryOutcome = MatchResultDraft['outcome']

export type BinaryResultBuild = {
  issues: ValidationIssue[]
  results: MatchResultDraft[]
}

function assertUniqueIds(ids: readonly string[], label: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${label} must not contain duplicate IDs.`)
  }
}

export function buildBinaryWinLossResults(
  game: GameDefinition,
  teamIds: readonly string[],
  winnerTeamIds: readonly string[],
): BinaryResultBuild {
  assertUniqueIds(teamIds, 'Team IDs')
  assertUniqueIds(winnerTeamIds, 'Winner team IDs')

  const teamSet = new Set(teamIds)
  if (winnerTeamIds.some((teamId) => !teamSet.has(teamId))) {
    throw new Error('Every winner must belong to the match.')
  }

  const winners = new Set(winnerTeamIds)
  const winnerPlacement = new Map(winnerTeamIds.map((teamId, index) => [teamId, index + 1]))
  const results = teamIds.map((teamId) => ({
    outcome: winners.has(teamId) ? 'win' as const : 'loss' as const,
    placement: winnerPlacement.get(teamId),
    teamId,
  }))

  return { issues: validateCompletedResult(game, results), results }
}

export function buildBinaryDrawResults(
  game: GameDefinition,
  teamIds: readonly string[],
): BinaryResultBuild {
  assertUniqueIds(teamIds, 'Team IDs')

  const results = teamIds.map((teamId) => ({ outcome: 'draw' as const, teamId }))
  return { issues: validateCompletedResult(game, results), results }
}

export function buildBinaryNoContestResults(
  game: GameDefinition,
  teamIds: readonly string[],
): BinaryResultBuild {
  assertUniqueIds(teamIds, 'Team IDs')

  const results = teamIds.map((teamId) => ({ outcome: 'no_contest' as const, teamId }))
  return { issues: validateCompletedResult(game, results), results }
}

export function getBinaryOutcomeLabel(outcome: BinaryOutcome): string {
  return outcome === 'no_contest' ? 'No contest' : outcome.replace('_', ' ')
}
