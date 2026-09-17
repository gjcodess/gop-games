import type { MatchStatus } from './matchTypes'

const transitions: Record<MatchStatus, readonly MatchStatus[]> = {
  active: ['cancelled', 'completed'],
  archived: [],
  cancelled: ['archived'],
  completed: ['archived'],
  setup: ['active', 'cancelled'],
}

export function canTransitionMatch(from: MatchStatus, to: MatchStatus): boolean {
  return transitions[from].includes(to)
}

export function assertMatchTransition(from: MatchStatus, to: MatchStatus): void {
  if (!canTransitionMatch(from, to)) {
    throw new Error(`Invalid match transition: ${from} → ${to}.`)
  }
}

export function isTerminalMatchStatus(status: MatchStatus): boolean {
  return status === 'archived' || status === 'cancelled' || status === 'completed'
}
