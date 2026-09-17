# Realtime Contract

## Source of truth

Realtime is a notification and low-latency delivery layer. PostgreSQL remains authoritative. A client must be able to recover from a missed, duplicated, reordered, or delayed message by refetching a match snapshot and event cursor.

## Topics

- `match:<match-id>` for an active match.
- `group:<group-id>` for optional lobby updates.

All topics are private. Realtime authorization checks that the authenticated profile has active membership in the owning group. Clients do not publish canonical score changes directly.

## Domain envelope

Every committed envelope carries `match_id`, `version`, `sequence`, `event_id`, `event_type`, `actor_profile_id`, `occurred_at`, and a compact invalidation/delta summary. Payloads never contain secrets.

## Reconciliation

- Older or equal versions are ignored as stale/duplicate.
- The exact next version may patch the relevant query cache.
- A version gap triggers a snapshot/event refetch.
- Joining, reconnecting, focus restoration, token refresh, and degraded status trigger reconciliation.
- Channel cleanup is mandatory on unmount, route/group change, logout, and session changes.

## Mutations

Each mutation contains an idempotency `client_event_id` and `expected_version`. The RPC locks the smallest required aggregate scope, validates membership and state, appends history, updates projections, increments the version, and emits one committed notification. A duplicate key returns the original result; a stale version returns a conflict.

