# GOP Games Architecture

This directory records the approved implementation shape for the GOP Games companion. It is intentionally implementation-oriented: the database and realtime documents describe invariants that must remain true when features are built.

- [Data model](./data-model.md) — entities, ownership, scoring projections, and migration conventions.
- [Realtime](./realtime.md) — channel, event, concurrency, and recovery rules.
- [Security](./security.md) — Auth, RLS, Storage, grants, secrets, and privileged operations.

The project is a Vite React SPA with narrow Node.js Vercel Functions. Supabase is the database and identity boundary; the browser never receives a Supabase secret key.

