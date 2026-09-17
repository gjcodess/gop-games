# ADR 0002: Group-Scoped Match Aggregate with Audited Corrections

## Status

Accepted for implementation after plan approval.

## Decision

Use groups and memberships from the first release. A profile may belong to many groups. Matches contain explicit teams, participants, results, projections, and append-only events. Completed corrections are represented by reversal/replacement events and archival rather than silent row edits.

## Rationale

The private group currently has one social context, but group boundaries are important for RLS and future use. Explicit teams support individual, team, and mixed configurations without separate schemas. Audited corrections preserve trust in match history and statistics.

## Consequences

The initial UI includes group creation, invitations, roles, and switching. Statistics must define how projections exclude archived/cancelled matches and apply team outcomes to members.

