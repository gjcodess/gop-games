# GOP Games Project Instructions

## Project overview

GOP Games is a private, mobile-first game-night companion. It records matches and player history; it does not host or play the physical games. The application must feel like a premium, tactile game companion rather than a generic SaaS dashboard.

The first supported domains are:

- Binary win/loss games, including games with multiple winners.
- Flip 7 round scoring with a card/modifier calculator and a 200-point finish rule.
- Billiards visual tracking for 8-ball, 15-ball consecutive, and cutthroat with flexible teams.
- Rules, statistics, history, search, and reusable game-night utilities.

## Technology and deployment

- React + TypeScript + Vite single-page application.
- CSS Modules and semantic CSS custom properties; no general-purpose component library by default.
- Supabase Auth, PostgreSQL, Storage, and Realtime.
- Node.js 24 Vercel Functions for privileged server operations only.
- Vercel hosting and npm with a committed lockfile.
- Use Supabase publishable keys in the browser and secret keys only in server environments.

## Architecture rules

1. PostgreSQL is the source of truth for match state, score history, authorization-sensitive validation, and completion.
2. Client reads use Supabase under RLS. Invariant-sensitive mutations use typed transactional RPCs.
3. Every mutating command includes an idempotency key and expected aggregate version.
4. Durable event history and current projections are both intentional. Never silently rewrite completed history.
5. Realtime transports committed changes; it is not a second source of truth. Reconnects and version gaps must refetch canonical state.
6. Use private Realtime channels and authorize them from group membership. Never expose canonical updates through public channels.
7. Authorization is based on database membership and roles, never on user-editable Auth metadata.
8. Keep global games/rules separate from group-owned matches. Global catalog edits require a system role.
9. Match teams always support one or more participants. Do not hard-code 1v1 or 2v2.
10. Billiards v1 is a visual tracker with manually confirmed results, not an automatic referee.
11. Flip 7 calculations must be duplicated in UI only for preview; the database recalculates and validates the committed result.

## Repository conventions

- Use feature folders under `src/features` for domain behavior.
- Keep reusable UI under `src/components`; do not promote one-off game UI prematurely.
- Colocate CSS Modules, tests, hooks, and adapters with their feature when they are feature-specific.
- Use lowercase kebab-case for folders, PascalCase for React components, camelCase for functions/variables, and snake_case for SQL identifiers.
- Use explicit return types for exported TypeScript functions and discriminated unions for domain states.
- Use `timestamptz`, UUIDs for externally referenced entities, and bigint identity keys for high-volume event rows.
- Prefer text plus check constraints over PostgreSQL enums when a state may evolve.
- Keep database types generated from the schema and reviewed in version control.

## Database workflow

- All schema changes belong in reviewed Supabase migrations.
- Use the Supabase CLI local workflow and reset the local database before committing migration changes.
- Add RLS, explicit Data API grants, foreign-key indexes, constraints, and tests in the same change as each table.
- Do not modify production schema directly in the Dashboard.
- Do not use service/secret credentials in browser code, tests committed to the repository, or seed files.
- Seed catalog data and unclaimed profile fixtures only; never seed passwords, raw invitation tokens, or secrets.
- Exposed views must use `security_invoker = true` or live in an unexposed schema.
- Treat `SECURITY DEFINER` as exceptional: use an empty search path, fully qualified names, explicit caller checks, and narrow execute grants.

## Realtime workflow

- Subscribe only while the relevant match or group view is mounted.
- Clean up channels on unmount, route/group change, logout, and auth changes.
- Include match ID, committed version, sequence/event ID, event type, and timestamp in every domain envelope.
- Ignore duplicate/older versions, reconcile gaps, and refetch after reconnect.
- Optimistic UI is allowed only when rollback and conflict handling are implemented.
- A successful database commit must remain correct even if a broadcast is delayed or missed.

## UI and UX principles

- Design for phones first; preserve usable touch targets at narrow widths.
- Use semantic tokens, not raw game colors inside components.
- Each game has an intentional visual identity, but shared controls remain familiar.
- Use motion to explain state changes and reward actions; honor reduced-motion preferences.
- Do not use repetitive card grids, generic dashboard sidebars, unnecessary glassmorphism, or arbitrary gradients.
- Loading, degraded realtime, empty, error, and permission states are part of every core flow.
- Use accessible labels, focus states, dialogs, form errors, and keyboard paths from the start.

## Security rules

- Never log tokens, invitation secrets, passwords, secret keys, or full private payloads.
- Never use `user_metadata` for authorization.
- Validate at the UI, API/RPC, and database layers.
- Require group membership for every group-owned read and mutation.
- Archive or reverse destructive match operations; do not silently delete match history.
- Keep avatar storage private and validate uploaded file type, size, and dimensions.

## Testing gates

Before a feature is considered complete, run the relevant unit tests, database/RLS tests, typecheck, lint, and focused UI tests. Core match changes also require a two-browser-context realtime test. Release gates include local Supabase reset, migration replay, production build, accessibility checks, and security review.

Read the specialized skill in `.agent/skills/<name>/SKILL.md` before making changes in that domain.

