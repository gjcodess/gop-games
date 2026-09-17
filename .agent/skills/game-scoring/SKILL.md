---
name: game-scoring
description: Design or implement GOP Games match lifecycle, binary outcomes, Flip 7 scoring, teams, or billiards state while preserving authoritative validation and auditable history.
---

# Game Scoring

Use this skill for any scoring model, match lifecycle, team assignment, result, score correction, or game-specific state change.

## Non-negotiable invariants

- PostgreSQL is authoritative for committed state and completion.
- Every mutation carries an idempotency key and expected aggregate version.
- Append events before/with projection updates in one transaction.
- Never assume one winner; the game definition declares winner cardinality.
- Teams are explicit sides containing one or more match participants.
- Completed history is corrected by reversal/supersession, not silent mutation.
- UI calculators are previews; RPC/database validation recalculates the result.

## Binary games

Represent every competitor as a team, including singleton teams. Record a result for each participating team. Permit multiple `win` outcomes when configured; Moose Master supports two winners. Allow draw/no-contest/cancelled states explicitly and reject incomplete completed results.

## Flip 7

Store round/player inputs and scoring cards, not only a final total. Calculate in this order: number-card subtotal, `x2` on that subtotal, additive modifiers, then the 15-point seven-distinct-number bonus. A bust scores zero. Finalize the complete round atomically, then evaluate the 200-point rule. A tied highest score at or above 200 keeps the match active for another round.

## Billiards

Keep separate projections for ball state, assignments, turns, and events. Validate ball numbers, participant/team ownership, and assignment consistency. V1 is a visual tracker: do not invent automatic foul adjudication. Require an authorized confirmed result to complete a match.

## Concurrency checklist

Before changing scoring behavior, identify the lock scope, stale-version response, duplicate-command response, completion race, correction path, and realtime envelope. Add unit tests for algebra and database tests for transaction behavior.

