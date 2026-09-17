# ADR 0001: Vite SPA with Narrow Vercel Functions

## Status

Accepted for implementation after plan approval.

## Decision

Use a React/TypeScript/Vite SPA for the phone-first private application. Use Node.js Vercel Functions only for privileged operations such as invitation handling and future feedback/newsletter integrations. Use the Supabase browser client directly for RLS-protected reads and database RPC calls.

## Rationale

The product has no public SEO requirement, depends heavily on browser realtime connections, and benefits from a small client shell. A persistent Express service would add deployment and operational overhead without improving the main match flows.

## Consequences

Game mutations must be implemented as secure transactional RPCs. Functions must remain stateless and must never become an alternate source of match state.

