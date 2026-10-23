# Owner sign-in (`admin1`)

This is an alternate login name for the existing Supabase account owner. It is not a master key or a site-wide administrator role.

## Private setup

1. Enter a unique password in `IDEADNA_OWNER_PASSWORD=` in `.env.local`. Use at least 16 characters and at most 72 UTF-8 bytes. Never commit or paste it into chat.
2. Run `node scripts/setup-owner.cjs` from this directory. It uses the local Supabase service-role key to find the one non-demo account (or the explicit `IDEADNA_OWNER_USER_ID`), preserve its UUID, set its password, confirm only that account, and rename its public username to `admin1`.
3. The script verifies password sign-in, removes the temporary plaintext password from `.env.local`, and records only `IDEADNA_OWNER_USER_ID` locally.
4. Add `IDEADNA_OWNER_USER_ID` to Vercel's Production environment and deploy the code. This UUID is the same identifier already used by the public profile; it is not a password. Never upload `IDEADNA_OWNER_PASSWORD` to Vercel.
5. Sign in at `/login` with username `admin1` and the chosen password.

If there is more than one non-demo user, setup refuses to guess. Specify the intended existing account UUID before running. It also refuses to take another account's `admin1` username.

## Data and permissions

The UUID remains unchanged. Existing trees, nodes, reactions, and revisions keep their ownership. Future changes use the same Supabase session and remain stored across logouts, devices, and deployments. The account retains ordinary RLS permissions; it cannot read other people's private trees or manage users.

The new password replaces the existing account password. It is stored as a salted password hash by Supabase Auth, not reversible custom encryption. The app never hard-codes it, writes it into source, returns session tokens from the alias endpoint, or logs it. HTTPS protects it in transit.

`/api/auth/owner-login` validates same-origin requests, accepts only `admin1`, resolves only the configured UUID, validates the password through Supabase Auth, requires the resulting session to match that same UUID, and sets a regular cookie-based session. Supabase authentication rate limits remain active. Error responses are generic and marked no-store.

This does not disable email confirmation for public signups or resolve the email provider's project-wide sending quota.

## Activation status

Activated on October 23, 2026 and deployed to https://ideadna.vercel.app.
Deployment: dpl_G2d3hdWTVD4ZWrtmxyKUFqisngHx.

- Existing owner UUID retained; no account recreation or ownership transfer.
- Owner password set and verified through Supabase Auth.
- Only this owner account was confirmed, as explicitly requested.
- Username alias: admin1. Ordinary user permissions retained.
- Temporary plaintext setup password removed from the local environment file.
- Vercel received only IDEADNA_OWNER_USER_ID, not the owner password.
- Unit tests, TypeScript, local production build, and Vercel production build passed.
- Live login page exposes the username field. Incorrect passwords return HTTP 401 with a generic error.

The account had zero owned trees and zero authored contributions at setup time. Future logged-in contributions use its unchanged UUID and persist in Supabase.
