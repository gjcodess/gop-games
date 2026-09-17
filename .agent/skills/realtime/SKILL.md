---
name: realtime
description: Implement or review GOP Games Supabase Realtime synchronization, private channels, optimistic updates, reconnection, ordering, and multi-device consistency.
---

# Realtime

Use this skill whenever a feature must update another connected device or changes subscription lifecycle.

## Transport contract

- Use private `match:<id>` topics and optional `group:<id>` topics.
- Authorize receive access from active group membership through `realtime.messages` policies.
- Clients never publish canonical score changes directly.
- A committed database transaction emits one compact domain envelope.

## Envelope and reconciliation

Every envelope includes match ID, monotonic aggregate version, sequence, event ID, event type, actor, and timestamp. Ignore versions already applied, patch only the exact next version, and refetch a canonical snapshot when a gap appears. Joining, reconnecting, focus restoration, JWT refresh, or degraded state must reconcile.

## Mutation behavior

Send `client_event_id` and `expected_version` to the transactional RPC. Treat duplicate IDs as idempotent success. Treat stale versions as conflicts that refetch before retry. Optimistic UI must define rollback and must not mark an uncommitted value as durable.

## Lifecycle

Create subscriptions only while a relevant view is mounted. Remove them on unmount, route/group change, logout, and session change. Surface connecting/live/degraded/offline/recovering states. Do not use transport delivery as the source of truth.

## Verification

Use two independent browser contexts against local Supabase. Test duplicate/out-of-order events, simultaneous updates, missed broadcasts, reconnect, token refresh, subscription cleanup, and successful database commit with delayed transport.

