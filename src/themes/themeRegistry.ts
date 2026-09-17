import type { GameThemeKey, ThemeDefinition } from './themeTypes'

export const GAME_THEME_REGISTRY: readonly ThemeDefinition[] = [
  {
    description: 'The warm, grounded house style for the game room.',
    key: 'default',
    label: 'Game room',
  },
  {
    description: 'A sharp red-and-black table with plenty of attitude.',
    key: 'uno-no-mercy',
    label: 'UNO No Mercy',
  },
  {
    description: 'Soft colors, bouncy energy, and a playful table mood.',
    key: 'taco-cat-goat-cheese-pizza',
    label: 'Taco Cat Goat Cheese Pizza',
  },
  {
    description: 'A casino-table atmosphere for chasing the next point.',
    key: 'flip7',
    label: 'Flip 7',
  },
  {
    description: 'Green felt, warm rails, and physical table energy.',
    key: 'billiards',
    label: 'Billiards',
  },
  {
    description: 'A lively challenge-night mood for the Moose Master table.',
    key: 'moose-master',
    label: 'Moose Master',
  },
]

const themeKeys = new Set<GameThemeKey>(GAME_THEME_REGISTRY.map((theme) => theme.key))

export function isGameThemeKey(value: string): value is GameThemeKey {
  return themeKeys.has(value as GameThemeKey)
}

export function getGameTheme(key: GameThemeKey): ThemeDefinition {
  return GAME_THEME_REGISTRY.find((theme) => theme.key === key) ?? GAME_THEME_REGISTRY[0]
}
