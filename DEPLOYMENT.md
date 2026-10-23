# Vercel deployment

## Production

1. Push this directory to your own Git repository. `.gitignore` excludes `.env.local`, dependencies, build output, and TypeScript caches. Commit `.env.example` and `package-lock.json`.
2. Import the repository into Vercel. Choose Next.js, Node 24 (or compatible Node 22), root directory `.`, install command `npm ci`, build command `npm run build`. Do not configure a static export: synthesis and authentication require server routes.
3. Add the variables from `.env.example` in Vercel Settings → Environment Variables. Supabase URL and anonymous key are public; the service-role and AI keys must remain server-only. Use your free-tier project/provider quotas.
4. Apply the SQL migration to the target Supabase project. Seed only a separate demonstration project. The database and storage bucket must exist before testing writes.
5. Deploy. Copy the actual deployment URL into Supabase Authentication → Site URL. Add `https://YOUR-VERCEL-HOST/auth/callback` to allowed redirect URLs. Redeploy if environment variables change.
6. Verify sign-up confirmation, sign-in, profile editing, a public and private tree, two-browser realtime contributions, avatar upload, and synthesis. Confirm signed-out visitors cannot mutate content.

## Preview environments

Vercel creates a preview for each branch/PR. Set Preview-scoped environment variables to a separate Supabase development project and separate provider key/quota. Apply the migration there. Allow the exact preview callback URL in that Supabase project. If using a wildcard callback, scope it narrowly to your own Vercel project/team, never every Vercel deployment. Keep production data out of previews.

## Custom domain

Add your domain in Vercel → Project Settings → Domains. Follow the exact DNS records shown by Vercel and wait for verification/TLS. Set the Supabase Site URL to your canonical HTTPS domain and allow `/auth/callback` on it. Check that confirmation emails return to the canonical host and that alternate domains redirect consistently.

## Operational notes

The route declares a 60-second duration; provider calls each have a 23-second timeout, with at most two attempts. Provider rate limits are errors, never a billing upgrade. Synthesis reservations enforce eight requests/user/hour in PostgreSQL. Tune limits deliberately for your project. Failed requests remain in the audit trail. Monitor provider quotas and Supabase usage with their own dashboards. Public profiles and contribution history are intentional product data; preserve RLS and narrow grants.

No Vercel credentials or Supabase project credentials were supplied during implementation. The app is prepared for deployment; live provisioning and hosted end-to-end checks require those accounts.
