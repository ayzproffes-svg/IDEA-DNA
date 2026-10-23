# Verification report

## Passed

- TypeScript strict compilation (`npm run typecheck`).
- Optimized Next.js production compilation (`npm run build`, Webpack).
- All required App Router page and API entry points compile, plus `/dashboard`, auth callback, privacy/terms, and loading/error boundaries.
- Zod validation checks: valid contribution; unsafe source URLs; title/content bounds; synthesis-only node creation; distinct synthesis sources; slug constraints; incomplete AI response rejection.
- PostgreSQL migration executes against PGlite with minimal Supabase auth/storage schemas and roles.
- Database checks cover automatic profiles, transactional tree/root creation, trusted authorship, immutable sensitive columns, owner/editor permissions, public/private and archived visibility, invalid cross-tree contribution rejection, full content revisions, reaction-derived scores, server-only synthesis completion, both synthesis edges, and hourly limits.
- Full SQL demo seed executes with 3 trees, 24 contributions, 4 sample profiles, reaction rows, and 3 structured synthesis blueprints. In the embedded test only, password hashing is replaced with an unusable test value because pgcrypto is a Supabase/PostgreSQL extension.
- Browser desktop checks: landing/discovery rendering, topical filtering, graph rendering, node detail drawer, contribution composer, saving a demo contribution (node count changed from 8 to 9), and two-node selection enabling/opening the synthesis panel.
- Desktop landing and graph screenshots were visually inspected during development.

## Verification limits

The browser's automatic access review later timed out, so the remaining browser checks were not completed. Mobile breakpoints, keyboard focus management, light mode, and empty/error states are implemented but did not receive a final browser pass. This timeout was not an unsafe-action determination.

No Supabase or AI provider credentials were supplied. Hosted Auth email delivery/session refresh, Storage uploads, two-browser Realtime delivery, and actual Groq/Gemini generation require a connected project and remain unverified against live services. The database engine tests validate SQL behavior; they do not emulate Supabase's HTTP services.

No Vercel project or deployment was created. Vercel configuration and exact account setup steps are included in `DEPLOYMENT.md`.

## Connected-workspace acceptance steps

1. Apply the migration, set environment variables, and restart the app.
2. Create two separate accounts. Confirm email and sign in.
3. Create a public tree in browser A; contribute in browser B; confirm A receives the branch without reloading.
4. Edit a contribution and inspect its previous content in history. Confirm another contributor cannot edit it unless they own the tree.
5. Create private and unlisted trees; confirm private data is unavailable signed out and unlisted data is absent from Explore.
6. Upload a supported avatar; reject an unsupported or oversized file.
7. React twice with the same reaction; confirm it does not inflate the score.
8. Select two nodes, request synthesis, inspect all blueprint sections, and confirm both source edges and the completed request.
9. Try an unauthorized write, two identical sources, a cross-tree source pair, and a ninth synthesis in an hour; confirm rejection.
10. Check at 390 px and 1440 px widths, keyboard-only navigation, light/dark themes, and reduced-motion preference.
