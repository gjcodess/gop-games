---
name: database
description: Design or change the GOP Games Supabase/PostgreSQL schema, migrations, grants, RLS, RPCs, indexes, seeds, or statistics queries.
---

# Database

Use this skill for schema, SQL, migration, RLS, database-function, index, seed, or data-access work.

## Schema conventions

- Use UUIDs for externally referenced entities and bigint identity keys for high-volume event rows.
- Use `timestamptz`, lowercase snake_case, text plus check constraints, explicit foreign-key indexes, and named constraints.
- Keep relationships normalized; use JSONB only for validated bounded settings or event payloads.
- Store match rule/scoring-engine revisions so historical behavior is reproducible.

## Migration workflow

Use the Supabase CLI local workflow. Create migrations through the CLI, review generated SQL, reset the local database, run database tests, generate types, and inspect advisors before commit. Never rely on an untracked Dashboard edit. Never reset or include development seed data against production.

## Grants and RLS

Every exposed table needs deliberate grants and RLS; grants determine reachability and RLS determines rows. Policies must use `to authenticated` plus a real ownership/membership predicate and wrap stable auth calls in `(select auth.uid())`. UPDATE policies require both `using` and `with check`.

Use group membership as the authorization source. Do not authorize from `raw_user_meta_data`. Exposed views must use `security_invoker = true`. Index every column used in a policy.

## Functions

Default to `SECURITY INVOKER`. If a narrow RPC must be `SECURITY DEFINER`, use an empty search path, fully qualified names, explicit caller checks, limited execute grants, and tests proving outsider denial. Keep server-only helpers in an unexposed schema.

## Seeds and statistics

Seeds may include catalog/rule fixtures and unclaimed friend profiles, but never passwords, raw invite tokens, or secrets. Derive statistics from completed, non-archived results until profiling justifies a projection. Test multiple winners, team inheritance, no-contest, corrections, and group isolation.

