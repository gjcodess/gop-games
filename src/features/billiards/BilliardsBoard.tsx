import type { BilliardsBall, BilliardsBallState } from './billiardsState'
import { getBilliardsBallLabel } from './billiardsState'
import styles from './BilliardsBoard.module.css'

export type BilliardsBoardProps = {
  balls: readonly BilliardsBall[]
  onBallSelect?: (ballNumber: number, nextState: BilliardsBallState) => void
  teamLabel?: (teamId: string) => string
}

function nextBallState(state: BilliardsBallState): BilliardsBallState {
  if (state === 'on_table') {
    return 'pocketed'
  }

  if (state === 'pocketed') {
    return 'removed'
  }

  return 'on_table'
}

function stateLabel(state: BilliardsBallState): string {
  return state.replace('_', ' ')
}

export function BilliardsBoard({ balls, onBallSelect, teamLabel }: BilliardsBoardProps) {
  return (
    <section aria-labelledby="billiards-board-heading" className={styles.table}>
      <div className={styles.tableHeader}>
        <div>
          <p className={styles.eyebrow}>Visual tracker</p>
          <h2 id="billiards-board-heading">Call the table</h2>
        </div>
        <p className={styles.helper}>Tap a ball to move it through table, pocketed, and removed.</p>
      </div>

      <div className={styles.rail}>
        <div aria-label="Billiards balls" className={styles.ballRack} role="group">
          {balls.map((ball) => {
            const nextState = nextBallState(ball.state)
            const assignment = ball.teamId
              ? ` Assigned to ${teamLabel?.(ball.teamId) ?? ball.teamId}.`
              : ''
            const label = `${getBilliardsBallLabel(ball.ballNumber)}: ${stateLabel(ball.state)}.${assignment} Tap to mark ${stateLabel(nextState)}.`

            return (
              <button
                aria-label={label}
                aria-pressed={ball.state !== 'on_table'}
                className={`${styles.ball} ${styles[`state-${ball.state}`]}`}
                data-ball={ball.ballNumber}
                disabled={!onBallSelect}
                key={ball.ballNumber}
                onClick={() => onBallSelect?.(ball.ballNumber, nextState)}
                type="button"
              >
                <span aria-hidden="true" className={styles.ballNumber}>{ball.ballNumber}</span>
                <span className={styles.ballState}>{stateLabel(ball.state)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className={styles.note}>This board records agreed table state. It does not adjudicate fouls or legal shots.</p>
    </section>
  )
}
