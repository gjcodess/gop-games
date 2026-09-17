# Phase 14 — Testing and Security Review

## Scope

This review covers the authentication boundary, Supabase client configuration, database/RLS posture, realtime authorization assumptions, scoring invariants, and critical accessibility interactions delivered through Phase 13.

## Verified controls

- Browser code reads only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. No service-role or secret key is referenced by the client.
- Group-owned reads are protected by database membership policies. Authorization decisions are made from database relationships rather than editable Auth metadata.
- Match mutations are exposed through authenticated-only RPC wrappers and retain expected-version and client-event idempotency inputs.
- Security-definer helpers are isolated in the private schema, use an empty `search_path`, and have explicit grants.
- Private realtime broadcast authorization is enforced by the `realtime.messages` membership policy. Realtime remains a transport for committed database changes, not a source of truth.
- Avatar storage reads are limited to profiles that share an active group; writes are limited to the owning profile.
- The database pgTAP contract now checks RLS, policy presence, RPC grants, security-definer configuration, and storage policy presence in addition to core schema objects.
- Browser regression coverage includes skip-link focus, theme control keyboard access, reduced-motion availability, and password visibility behavior.

## Verification commands

The Phase 14 gate runs:

```text
npm run typecheck
npm run lint
npm test -- --reporter=dot
npm run build
npm run test:e2e
npx supabase db lint --linked
git diff --check
```

The local Supabase pgTAP suite remains present under `supabase/tests/database`. It requires a running local Supabase stack; Docker/Podman is not available in the current environment, so the local database test command cannot be executed here. The linked cloud project also does not expose the pgTAP `plan()` function, so the assertions were verified through equivalent read-only catalog queries instead. These are environment limitations, not passing test results.

## Pre-release follow-up

Before production release, run the database suite after a clean local reset, exercise the RLS matrix with at least two authenticated users from different groups, and run the two-browser realtime match test against a deployed preview. Repeat the production build and scan deployment logs to ensure no secret values or private payloads are emitted.
