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
npm run db:push
npm run db:seed:cloud
npm run db:types:cloud
```

`db:reset` replays every migration and seed file locally. `db:push` applies reviewed migrations to the linked cloud project, while `db:seed:cloud` explicitly loads the development catalog fixtures. `db:test` runs the pgTAP database checks, and the type commands write generated TypeScript types to `src/lib/supabase/database.types.ts` from either the local or linked `public` schema. See [AGENTS.md](./AGENTS.md) for project rules and [docs/architecture](./docs/architecture) for the approved architecture.

## Production deployment

Vercel uses the committed `vercel.json` configuration and deploys the `dist` output from `npm run build`. Configure the browser-safe `VITE_*` variables in separate Preview and Production environments; never add Supabase secret/service-role keys to a `VITE_*` variable. The GitHub Actions workflow runs typecheck, lint, unit tests, the production build, and browser tests on pull requests and `main` pushes. See [the production runbook](./docs/deployment/production-runbook.md) for migration approval, Supabase checks, smoke testing, monitoring, and rollback guidance.
