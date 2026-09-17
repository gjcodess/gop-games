export type ThemeMode = 'light' | 'dark' | 'system'

export type GameThemeKey =
  | 'billiards'
  | 'default'
  | 'flip7'
  | 'moose-master'
  | 'taco-cat-goat-cheese-pizza'
  | 'uno-no-mercy'

export type ThemeDefinition = {
  description: string
  label: string
  key: GameThemeKey
}
