---
name: testing
description: Plan or implement GOP Games tests for scoring, Supabase data/RLS, Auth, realtime synchronization, accessibility, and critical mobile interactions.
---

# Testing

Use this skill for test strategy, regression tests, release gates, or any change affecting match correctness or authorization.

## Required layers

- Unit: scoring algebra, winner rules, randomization, reducers, theme resolution.
- Database: constraints, RPCs, projections, corrections, statistics, grants, and RLS role matrices.
- Integration: Auth, invitations, match creation, score commits, Storage policies.
- UI: forms, navigation, dialogs, responsive layouts, score controls, billiard controls, utilities.
- Realtime E2E: two independent browser contexts and real local Supabase channels.

## Required edge cases

Test two winners, no winner/no-contest, invalid and excessive scores, duplicate commands, stale versions, simultaneous updates, missed/reordered events, reconnect, incomplete matches, player leaving, correction/archival, tie rounds, and unauthorized group access.

## Workflow

Prefer local Supabase over mocks for RLS, RPC, and realtime behavior. Use deterministic injected randomness for utility unit tests. Use Playwright for critical mobile flows and reduced-motion/accessibility paths. Run typecheck, lint, focused tests, database reset/tests, and production build before release.

## Evidence

Tests should prove observable behavior and authorization boundaries, not merely match implementation details. A failing realtime transport must still leave the client able to recover the committed database state.

