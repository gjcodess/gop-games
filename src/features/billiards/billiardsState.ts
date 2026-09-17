export type BilliardsBallState = 'on_table' | 'pocketed' | 'removed'
export type BilliardsMode = '15_ball_consecutive' | '8_ball' | 'cutthroat'

export type BilliardsBall = {
  ballNumber: number
  state: BilliardsBallState
  teamId?: string | null
}

export type BilliardsAssignment = {
  ballNumbers: number[]
  teamId: string
}

export function createInitialBilliardsBalls(): BilliardsBall[] {
  return Array.from({ length: 15 }, (_, index) => ({
    ballNumber: index + 1,
    state: 'on_table' as const,
    teamId: null,
  }))
}

export function isValidBilliardsBallNumber(ballNumber: number): boolean {
  return Number.isInteger(ballNumber) && ballNumber >= 1 && ballNumber <= 15
}

export function validateBilliardsAssignment(assignment: BilliardsAssignment): string | null {
  if (!assignment.teamId) {
    return 'An assignment needs a team.'
  }

  if (assignment.ballNumbers.length > 15) {
    return 'An assignment cannot contain more than 15 balls.'
  }

  if (new Set(assignment.ballNumbers).size !== assignment.ballNumbers.length) {
    return 'An assignment cannot contain duplicate balls.'
  }

  if (assignment.ballNumbers.some((ballNumber) => !isValidBilliardsBallNumber(ballNumber))) {
    return 'Assignments must use balls 1 through 15.'
  }

  return null
}

export function validateAssignmentSet(assignments: readonly BilliardsAssignment[]): string | null {
  const assignedBalls = new Set<number>()

  for (const assignment of assignments) {
    const issue = validateBilliardsAssignment(assignment)
    if (issue) {
      return issue
    }

    for (const ballNumber of assignment.ballNumbers) {
      if (assignedBalls.has(ballNumber)) {
        return `Ball ${ballNumber} belongs to more than one team.`
      }
      assignedBalls.add(ballNumber)
    }
  }

  return null
}

export function getBilliardsBallLabel(ballNumber: number): string {
  return ballNumber === 8 ? '8-ball' : `Ball ${ballNumber}`
}
