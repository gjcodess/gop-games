import type { GameDefinition } from '../games/gameRegistry'

export type MatchStatus = 'setup' | 'active' | 'completed' | 'cancelled' | 'archived'

export type MatchParticipantDraft = {
  profileId: string
  seatOrder: number
}

export type MatchTeamDraft = {
  name?: string
  participantProfileIds: string[]
  position: number
}

export type MatchSetupDraft = {
  game: GameDefinition
  notes?: string
  participants: MatchParticipantDraft[]
  teams?: MatchTeamDraft[]
  variantSlug?: string
}

export type MatchResultDraft = {
  outcome: 'draw' | 'loss' | 'no_contest' | 'win'
  placement?: number
  teamId: string
}
