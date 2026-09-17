export type ScoringModel = 'binary' | 'flip7' | 'billiards'

export type GameVariantDefinition = {
  config: Record<string, boolean | number | string>
  name: string
  slug: string
}

export type GameDefinition = {
  allowsTeams: boolean
  maxPlayers: number | null
  maxWinners: number
  minPlayers: number
  minWinners: number
  name: string
  scoringModel: ScoringModel
  slug: string
  themeKey: string
  variants?: readonly GameVariantDefinition[]
}

const binaryGames = [
  ['monopoly-deal', 'Monopoly Deal', 'monopoly-deal', 2, 5],
  ['monopoly-bid', 'Monopoly Bid', 'monopoly-bid', 2, 5],
  ['uno', 'Uno', 'uno', 2, 10],
  ['dos', 'Dos', 'dos', 2, 4],
  ['uno-flip', 'Uno Flip', 'uno-flip', 2, 10],
  ['uno-no-mercy', 'Uno No Mercy', 'uno-no-mercy', 2, 6],
  ['uno-dare', 'Uno Dare', 'uno-dare', 2, 10],
  ['exploding-kittens', 'Exploding Kittens', 'exploding-kittens', 2, 5],
  ['cluedo-suspect', 'Cluedo Suspect', 'cluedo-suspect', 3, 6],
  ['dumb-ways-to-die', 'Dumb Ways to Die', 'dumb-ways-to-die', 2, 6],
  ['taco-cat-goat-cheese-pizza', 'Taco Cat Goat Cheese Pizza', 'taco-cat-goat-cheese-pizza', 3, 8],
] as const

export const GAME_REGISTRY: readonly GameDefinition[] = [
  ...binaryGames.map(([slug, name, themeKey, minPlayers, maxPlayers]) => ({
    allowsTeams: false,
    maxPlayers,
    maxWinners: 1,
    minPlayers,
    minWinners: 1,
    name,
    scoringModel: 'binary' as const,
    slug,
    themeKey,
  })),
  {
    allowsTeams: false,
    maxPlayers: 8,
    maxWinners: 2,
    minPlayers: 3,
    minWinners: 1,
    name: 'Moose Master',
    scoringModel: 'binary',
    slug: 'moose-master',
    themeKey: 'moose-master',
  },
  {
    allowsTeams: false,
    maxPlayers: 18,
    maxWinners: 1,
    minPlayers: 2,
    minWinners: 1,
    name: 'Flip 7',
    scoringModel: 'flip7',
    slug: 'flip-7',
    themeKey: 'flip7',
  },
  {
    allowsTeams: true,
    maxPlayers: 8,
    maxWinners: 1,
    minPlayers: 2,
    minWinners: 1,
    name: 'Billiards',
    scoringModel: 'billiards',
    slug: 'billiards',
    themeKey: 'billiards',
    variants: [
      { config: { ball_set: 'solids_stripes', manual_adjudication: true }, name: '8-Ball', slug: '8-ball' },
      { config: { ball_count: 15, manual_adjudication: true }, name: '15-Ball Consecutive', slug: '15-ball-consecutive' },
      { config: { ball_set: 'player_ranges', manual_adjudication: true }, name: 'Cutthroat', slug: 'cutthroat' },
    ],
  },
]

const registryBySlug = new Map(GAME_REGISTRY.map((game) => [game.slug, game]))

export function getGameDefinition(slug: string): GameDefinition | undefined {
  return registryBySlug.get(slug)
}

export function listGamesByScoringModel(scoringModel: ScoringModel): GameDefinition[] {
  return GAME_REGISTRY.filter((game) => game.scoringModel === scoringModel)
}
