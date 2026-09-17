# ADR 0003: Broadcast Notifications with Versioned Reconciliation

## Status

Accepted for implementation after plan approval.

## Decision

Use private Supabase Broadcast topics for committed domain notifications. PostgreSQL remains authoritative, and each match aggregate has a monotonic version plus append-only sequence. Clients optimistically update only with rollback and reconcile on any gap, reconnect, or conflict.

## Rationale

Broadcast is the recommended scalable/security-oriented Supabase path for database changes. It avoids coupling every client to raw table-change shapes and allows one domain event after a multi-table transaction.

## Consequences

Realtime policies on `realtime.messages` must be maintained and tested. No feature may depend on receiving every individual transport message for correctness.

