export type Flip7CardKind = 'action' | 'additive' | 'multiplier' | 'number'

export type Flip7CardDefinition = {
  cardKind: Flip7CardKind
  code: string
  numericValue: number | null
}

export type Flip7Score = {
  additivePoints: number
  busted: boolean
  distinctNumberCount: number
  hasMultiplier: boolean
  numberCardCount: number
  numberSubtotal: number
  points: number
}

export type Flip7Standing = {
  participantId: string
  total: number
}

export type Flip7Completion = {
  completed: boolean
  maxTotal: number
  winnerParticipantIds: string[]
}

export function calculateFlip7Score(
  cardCodes: readonly string[],
  definitions: readonly Flip7CardDefinition[],
): Flip7Score {
  const definitionsByCode = new Map(definitions.map((definition) => [definition.code, definition]))
  const cards = cardCodes.map((code) => {
    const definition = definitionsByCode.get(code)
    if (!definition) {
      throw new Error(`Unknown Flip 7 card: ${code}`)
    }
    return definition
  })

  const numberCards = cards.filter((card) => card.cardKind === 'number')
  const additivePoints = cards
    .filter((card) => card.cardKind === 'additive')
    .reduce<number>((total, card) => total + (card.numericValue ?? 0), 0)
  const multiplierCount = cards.filter((card) => card.cardKind === 'multiplier').length
  if (multiplierCount > 1) {
    throw new Error('A Flip 7 player can use at most one multiplier.')
  }

  const numberValues = numberCards.map((card) => card.numericValue)
  const distinctNumberCount = new Set(numberValues).size
  const busted = numberValues.length !== new Set(numberValues).size
  const numberSubtotal = numberValues.reduce<number>((total, value) => total + (value ?? 0), 0)
  const points = busted
    ? 0
    : (numberSubtotal * (multiplierCount === 1 ? 2 : 1))
      + additivePoints
      + (distinctNumberCount >= 7 ? 15 : 0)

  return {
    additivePoints,
    busted,
    distinctNumberCount,
    hasMultiplier: multiplierCount === 1,
    numberCardCount: numberCards.length,
    numberSubtotal,
    points,
  }
}

export function evaluateFlip7Completion(
  standings: readonly Flip7Standing[],
  target = 200,
): Flip7Completion {
  const maxTotal = standings.reduce((maximum, standing) => Math.max(maximum, standing.total), 0)
  const winnerParticipantIds = standings
    .filter((standing) => standing.total === maxTotal)
    .map((standing) => standing.participantId)

  return {
    completed: maxTotal >= target && winnerParticipantIds.length === 1,
    maxTotal,
    winnerParticipantIds: maxTotal >= target ? winnerParticipantIds : [],
  }
}
