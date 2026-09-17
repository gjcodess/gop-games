# Data Model Invariants

## Identity and groups

`profiles` is an application identity table with an optional unique `auth_user_id`. This allows the six initial friends to exist as unclaimed profile fixtures without putting credentials in seed data. A profile may belong to many groups through `group_memberships`.

Every group-owned row reaches a group through a direct or transitive foreign key. RLS policies must check active membership in that group.

Roles are `owner`, `admin`, and `member`. Membership status is separate from role. The last active owner cannot leave or be demoted until another owner exists.

## Catalog and rules

Games and variants are global catalog records. Rules use a document plus append-only revisions. A match stores the exact rule revision and scoring-engine version used when it began.

## Match aggregate

`matches` is the aggregate root. It owns a monotonic `version`, lifecycle status, group/game/variant references, and immutable setup choices. Teams and participants are always explicit. A singleton team represents an individual competitor; this makes team statistics and 1v2/2v2 layouts use the same relationship.

`match_events` is append-only audit history. Current result and score tables are projections that may be updated only inside authorized transactions which also append an event.

## Binary outcomes

`match_results` records an outcome per team. Several teams may have `win`; Moose Master is configured to allow two winners. A completed binary match must have a valid result for every participating team unless it is explicitly a draw, no-contest, or cancellation state.

## Flip 7

Rounds contain player input cards and calculator state. Finalization validates the cards, calculates the round score in PostgreSQL, appends score events, updates participant projections, and evaluates the 200-point rule only after the full round. Corrections supersede a round revision and append reversal/replacement events.

## Billiards

Billiards has a current state projection, ball state rows, assignment rows, turns, and an append-only event stream. Ball and assignment consistency is enforced. Legal-shot adjudication is intentionally outside v1; an authorized player confirms the result.

## Statistics

Statistics are derived from completed, non-archived result and score projections. Team outcomes apply to each member. Multiple winning teams each produce a win. Cancelled/incomplete matches are excluded from games played; no-contests are reported separately.

