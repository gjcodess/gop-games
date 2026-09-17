# Security Contract

## Keys and sessions

The browser uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Vercel Functions use `SUPABASE_SECRET_KEY` and never expose it. Email/password account creation is handled by Supabase Auth; no application table stores passwords or password hashes. Creating an account does not grant group access—database membership and RLS remain the authorization boundary.

## Authorization

Database membership, not user-editable metadata, is the authorization source. Every exposed table has explicit grants and RLS. Views use `security_invoker = true`. Sensitive writes are exposed as narrow RPCs; direct table writes are revoked where they could bypass validation.

## Invitations

Raw invitation tokens are sent once and stored only as digests. Tokens are single-use, short-lived, revocable, and bound to a group/profile/email. Acceptance is checked server-side and transactionally activates membership.

## Storage

Avatars live in a private bucket. Users may write only their own profile path; reads require a shared active group. Uploads are checked for MIME type, size, and dimensions.

## Auditing and destructive operations

Match corrections append reversal/replacement events. Completed matches are archived rather than silently deleted. Logs exclude tokens, secrets, passwords, and private payloads.
