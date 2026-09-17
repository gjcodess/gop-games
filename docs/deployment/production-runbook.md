# Production Deployment Runbook

## Release shape

GOP Games is deployed as a Vite single-page application on Vercel. Supabase Cloud remains the production identity, database, storage, and Realtime boundary. The browser talks to Supabase with the publishable key under RLS; privileged server operations, when introduced, belong in narrow Node.js Vercel Functions and use server-only secrets.

`vercel.json` defines the reproducible install/build/output commands, SPA fallback rewrite, immutable asset caching, and baseline security headers. The Content Security Policy permits only same-origin assets plus the configured Supabase HTTPS and WebSocket endpoints.

## Vercel project configuration

Create or select the Vercel project for this repository and keep the project root at the repository root.

- Framework preset: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 24.x, matching `.nvmrc` and `package.json`
- Production branch: the protected `main` branch
- Preview deployments: pull requests and non-production branches

Configure the following variables in Vercel. Set public browser variables separately for Preview and Production so a preview cannot accidentally point at the wrong Supabase project.

| Variable | Browser-visible | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase browser key; protected by RLS |
| `VITE_APP_URL` | Yes | Canonical deployment URL used by client links |
| `VITE_FEATURE_*` | Yes | Feature flags from `.env.example` |
| `SUPABASE_SECRET_KEY` | No | Reserved for future Vercel Functions only; never prefix with `VITE_` |

Do not paste `.env.local` into Vercel, commit environment files, or expose a Supabase secret/service-role key to the browser. Rotate a key from the Supabase dashboard if it is ever disclosed.

## Supabase production procedure

1. Confirm the Vercel project and Supabase project are the intended pair.
2. Review the migration diff and seed changes in the pull request.
3. Link the CLI to the production project from a trusted operator environment:

   ```text
   npx supabase link --project-ref <production-project-ref>
   npx supabase migration list --linked
   npx supabase db lint --linked
   npx supabase db advisors --linked --type security --level warn --fail-on error
   ```

4. Apply reviewed migrations with `npm run db:push` (or `npx supabase db push --linked`) after the release has been approved. Never edit production schema directly in the Dashboard.
5. Load `supabase/seed.sql` in production only when the catalog fixture changes have been reviewed for that environment. The seed contains no passwords or secrets, but it does contain development profile/catalog fixtures and should not be treated as an invitation mechanism.
6. Confirm the migration list, RLS posture, Auth settings, private avatar bucket, and Realtime publication after the deploy.

Migrations are forward-only. If a release needs correction, add a new reviewed migration or an explicit reversible/archive operation; do not rewrite an applied migration or silently delete match history.

## Release gates

Before merging a release:

```text
npm ci
npm run typecheck
npm run lint
npm test -- --reporter=dot
npm run build
npm run test:e2e
git diff --check
```

The GitHub Actions workflow runs these checks on pushes to `main` and pull requests. The local pgTAP suite additionally requires Docker/Podman; run `npm run db:reset` and `npm run db:test` from an environment with the local Supabase stack available.

## Post-deploy smoke test

After Vercel reports the deployment ready:

1. Open the preview/production URL over HTTPS and confirm the SPA fallback works at `/login`, `/app`, `/app/library`, and `/app/utilities`.
2. Confirm the browser has no missing-configuration notice and can create an authenticated session.
3. Check that rules, history, avatars, and profile updates respect the intended group membership.
4. Open the same match in two browser contexts and verify a committed score/event reaches the second context; temporarily disable the first connection and verify it refetches canonical state after reconnect.
5. Verify a hard refresh, sign-out, protected-route redirect, skip link, reduced-motion mode, and the mobile layout.

## Monitoring and incident response

- Use Vercel deployment/build/runtime logs for deployment failures and function errors. Do not add tokens, private match payloads, or passwords to logs.
- Use Supabase Auth, Database, Storage, and Realtime logs for service-side failures, RLS denials, migration errors, and channel connection issues.
- The application error boundary provides a user-safe recovery screen without rendering private error payloads. Until a privacy-reviewed error-reporting provider is approved, incident correlation uses deployment and Supabase logs rather than client telemetry.
- If a migration or RPC causes incorrect match state, stop further releases, preserve the event history, and use a reviewed corrective/reversal migration. Do not mutate completed history in place.
- If a credential is exposed, revoke/rotate it in Supabase and Vercel, redeploy with fresh variables, and review Auth/database logs for misuse.

## Rollback

Vercel application rollbacks may restore a prior deployment artifact, but database migrations are not automatically rolled back. Before releasing schema changes, document the compatible application version and corrective migration path. Roll back the frontend only when it remains compatible with the current database schema.
