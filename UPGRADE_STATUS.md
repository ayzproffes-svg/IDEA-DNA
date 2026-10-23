# IdeaDNA upgrade — 23 October 2026

## Preserved

The existing site, navigation, design, accounts and projects are retained. The admin1 owner sign-in route, account identifier and password configuration were not modified. New work uses the same account ownership and RLS permissions. No production data was reset or replaced. A source/schema/test checkpoint is saved in backups/pre-upgrade-20261023-*.zip, without environment files or credentials.

## Implemented

- Loading failures now leave the loading state and show recovery feedback; discovery has a retry action. The original public loading complaint does not mean the database is empty: a read-only production check returned 3 public trees and 24 public contributions, both HTTP 200.
- Existing React Flow graph extended with ancestor and descendant exploration, complete multi-source ancestry highlighting, fit/reset controls, tag-aware contribution search and a separate accessible list.
- Relationship lines distinguish proposed from owner-reviewed connections. Seven relationship types are supported. Keyword-ranked candidates are explicitly labelled as keyword matches, not semantic search.
- New AI analyst and two-node connection explanation use the existing Groq configuration, with the configured Google provider as fallback. Outputs describe similarities, differences, contradictions, recommendations and investigation questions. Auth, source access, schema validation and an eight-request hourly quota guard this route. Provider failures do not fabricate an analysis. Requests send only selected titles/text after the user runs the action.
- Persistent evidence references, assumptions, questions, risks and contribution-review proposals. Project owners can edit, accept, reject or resolve proposals. Original branches and authors remain intact. An append-only server-side event trail records proposal and review changes; the UI can inspect it.
- Side-by-side comparison of any two available snapshots of the selected contribution, changed-span additions/removals, and restoration as a new revision. New edits can record a reason. Legacy reasons cannot be reconstructed. Synthesis source navigation preserves both sources.
- Transparent readiness checklist reports recorded signals and next steps, not a scientific or business viability score.
- Project activity shows actual stored contributions, pending reviews and unresolved assumptions with filters. Existing Network Insights remains available.
- /demo is a public, isolated judge sandbox with a six-step, approximately three-minute walkthrough. It contains a sample assumption, a prewritten AI-style connection, an earlier version, branches and a traceable combined concept. Fictional identities and prewritten output are clearly labelled. Reset targets only ideadna-judge-* browser storage; real account storage and Supabase data are separate.
- Responsive workbench, visible selection states, native labelled controls, keyboard-operable node list and reduced-motion styles. Invalid nested history markup found during browser testing was repaired.

## Verification

- Existing validation, confirmation and admin1 authentication regression tests passed.
- Existing embedded PostgreSQL tests passed, including ownership, private visibility, revisions and transactional synthesis.
- New migration tests passed for duplicate/self-link prevention, attribution, AI provenance protection, owner-only review, audit history protection, private records/events, revision reasons and hourly AI quota.
- New graph/diff tests passed for multi-source ancestry, descendants, cycle handling, changed spans, reference safety and relationship validation.
- AI endpoint tests use a mocked provider and passed for authentication, unavailable sources, quota rejection, saved provenance, two-source relationships and malformed-provider recovery. These tests send no idea text externally.
- TypeScript passed. A complete optimized production build passed after using a separate build directory to avoid Windows file locks. Final verification is recorded in the task response.
- Browser checks on the local app confirmed node inspection, snapshot comparison, restoration retaining history, owner review changing the graph label, and walkthrough startup. A phone-sized layout check found no horizontal document overflow; this is not a full accessibility certification or device study.

## Configuration and release

1. Apply supabase/migrations/202610230003_innovation.sql once to the existing Supabase project using its SQL Editor or migration runner. The transaction adds tables, policies, audit functions, AI usage reservation and revision-reason columns. It does not change auth.users, owner credentials or existing project identities.
2. Existing Supabase public/server settings and Groq key are reused. Google fallback is optional. No new provider or search infrastructure is required.
3. Preview the upgrade against the migrated database. Verify admin1 login, real project refresh persistence, new evidence/review history, live AI generation and private-project isolation before promoting the deployment.
4. Deploy the existing Vercel project only after those checks. Production has not been deployed or migrated automatically by this upgrade.

## Practical limits

Semantic search is not enabled; search and related candidates use text. Synthesis remains two-source per operation; larger combinations can be built through successive synthesis nodes, preserving ancestry. Contribution review records do not silently replace or incorporate another author's text. Revision reasons can cite relevant branches, but historical reasons and a structured mapping from every old revision to its influences cannot be invented. Evidence acceptance means human review, not validation of a claim. Mobile assistive technology, performance/load benchmarks, multi-user concurrency, and the new live AI/database journey still need staging verification after migration.

Local verification output can be isolated by setting IDEADNA_BUILD_DIR; normal builds retain the default .next directory.

## Release completed

Migration applied and verified; production deployed as dpl_5HtWoJQ7n5dZqimXh19HW7X1Hddd. The live owner session and actual Groq analysis storage were verified. See RELEASE_STATUS.md for current status; earlier release-gate instructions above are now completed.
