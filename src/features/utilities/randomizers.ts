export type RandomSource = () => number
export type CoinSide = 'heads' | 'tails'

function randomIndex(length: number, random: RandomSource): number {
  if (length < 1) {
    throw new Error('Cannot choose from an empty list.')
  }

  const value = random()
  const normalized = Number.isFinite(value) ? Math.min(0.999999999, Math.max(0, value)) : 0
  return Math.floor(normalized * length)
}

export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, random)
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }

  return result
}

export function pickRandom<T>(items: readonly T[], random: RandomSource = Math.random): T {
  return items[randomIndex(items.length, random)]
}

export function assignTeams<T>(items: readonly T[], teamCount: number, random: RandomSource = Math.random): T[][] {
  if (!Number.isInteger(teamCount) || teamCount < 1) {
    throw new Error('Team count must be a positive whole number.')
  }
  if (items.length < teamCount) {
    throw new Error('Each team needs at least one player.')
  }

  const teams = Array.from({ length: teamCount }, () => [] as T[])
  shuffle(items, random).forEach((item, index) => {
    teams[index % teamCount].push(item)
  })
  return teams
}

export function flipCoin(random: RandomSource = Math.random): CoinSide {
  return randomIndex(2, random) === 0 ? 'heads' : 'tails'
}

export function pickOddOneOut<T>(items: readonly T[], random: RandomSource = Math.random): T {
  return pickRandom(items, random)
}
