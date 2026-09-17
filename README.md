# GOP Games

GOP Games is a mobile-first, real-time game-night companion for tracking matches, scores, rules, statistics, and reusable game-night utilities.

## Development

Use Node.js 24 and npm. Install dependencies, copy `.env.example` to `.env.local`, then start Vite:

```text
npm install
npm run dev
```

Available checks:

```text
npm run typecheck
npm run lint
npm test
npm run build
```

Supabase local development requires Docker Desktop or Podman. Once a container runtime is available:

```text
npm run db:start
npm run db:reset
npm run db:test
npm run db:types
# For the linked Supabase Cloud project:
npm run db:types:cloud
```

`db:reset` replays every migration and seed file. `db:test` runs the pgTAP database checks, and the type commands write generated TypeScript types to `src/lib/supabase/database.types.ts` from either the local or linked `public` schema. See [AGENTS.md](./AGENTS.md) for project rules and [docs/architecture](./docs/architecture) for the approved architecture.
