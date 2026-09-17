import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BilliardsBoard } from './BilliardsBoard'
import { createInitialBilliardsBalls } from './billiardsState'

describe('BilliardsBoard', () => {
  it('exposes ball state and emits the next state on tap', () => {
    const onBallSelect = vi.fn()
    render(<BilliardsBoard balls={createInitialBilliardsBalls()} onBallSelect={onBallSelect} />)

    expect(screen.getByRole('button', { name: /8-ball: on table/i })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /8-ball: on table/i }))
    expect(onBallSelect).toHaveBeenCalledWith(8, 'pocketed')
  })

  it('explains the manual-adjudication boundary', () => {
    render(<BilliardsBoard balls={createInitialBilliardsBalls()} />)
    expect(screen.getByText(/does not adjudicate fouls/i)).toBeVisible()
  })
})
