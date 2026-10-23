# IdeaDNA — Workflow and technology stack

IdeaDNA turns isolated discussion into a network of attributed, branching ideas. A root contribution defines the problem; collaborators extend, improve, question, or constrain it; selected contributions can be combined into a structured AI blueprint.

## Product workflow

Discover → Sign in → Start an idea → Contribute → Select two nodes → AI synthesis → Save and credit → Collaborate

1. **Discover:** browse the three demonstration trees, search titles and contribution content, and narrow results by topic. Public trees are discoverable; private trees follow ownership rules.
2. **Sign in:** authenticate through Supabase. A dedicated owner username alias uses the existing account rather than creating a temporary demo identity. It retains ordinary user permissions.
3. **Start an idea:** enter a title, description, initial contribution, topics, and visibility. A database transaction creates the tree and its root node.
4. **Contribute:** choose a parent contribution, supply a title and explanation, and select an extends, improves, challenges, or depends-on relationship. The new node retains its author and parent.
5. **Select two nodes:** choose two distinct, published contributions from the same tree. The synthesis panel allows an optional user intent.
6. **AI synthesis:** the server authenticates the request, validates both sources and the input, reserves a rate-limited request, and calls the AI provider. Zod validates the resulting blueprint.
7. **Save and credit:** a server-authorized database transaction creates the synthesis node, connects it to both sources, and records the completed request. Existing author attribution is preserved.
8. **Collaborate:** inspect contribution details and revision history, add reactions, continue branching, and receive authorized realtime updates.

## Architecture

```text
Browser: Next.js / React / TypeScript
  | UI: Tailwind CSS, shadcn-style components, React Flow
  |
  +--> Next.js server routes + Zod
         |
         +--> Supabase PostgreSQL + RLS
         |      Profiles, trees, nodes, edges, reactions,
         |      synthesis requests, immutable revisions
         |
         +--> Groq: GPT-OSS 120B
                Optional Gemini fallback

Browser <--> Supabase Auth, authorized data reads,
             Realtime subscriptions, avatar Storage

Vercel hosts the Next.js application over HTTPS.
```

The architecture image emphasizes the server-side paths. The client also accesses Supabase through its browser client for authentication, authorized reads, realtime events, profile updates, and avatar uploads. Row Level Security applies to these direct browser database operations. Supabase does not independently call the AI provider.

## Technology stack

| Layer | Technology | Role |
| --- | --- | --- |
| Application | Next.js App Router, React, TypeScript | Pages, navigation, typed components, server routes |
| Styling | Tailwind CSS v4, custom CSS tokens | Responsive layouts, dark/light appearance, focus states |
| UI primitives | Radix Slot, CVA, clsx, tailwind-merge | shadcn-style composable Button and component variants |
| Icons | Lucide React | Consistent interface symbols |
| Graph | @xyflow/react / React Flow | Idea nodes, edges, pan, zoom, minimap, selection |
| Validation | Zod | Bounded request input and structured AI output |
| Database | Supabase PostgreSQL | Persistent ideas, ownership, attribution and revision history |
| Access control | PostgreSQL Row Level Security | Authorized reads and ownership-aware writes |
| Identity | Supabase Auth and @supabase/ssr | Password checks, cookie sessions, confirmation callbacks |
| Collaboration | Supabase Realtime | Authorized change subscriptions |
| Files | Supabase Storage | User avatar uploads |
| AI | Groq, default GPT-OSS 120B | Hybrid blueprint generation |
| Optional AI | Google Gemini | Fallback only when configured |
| Hosting | Vercel | Production builds, HTTPS and environment configuration |
| Tests | Node assertions, PGlite, TypeScript | Validation, auth, database-policy and compilation checks |

The actual implementation uses a custom data/realtime hook rather than TanStack Query. Framer Motion is not installed; CSS provides short transitions. These technologies are not represented as implemented dependencies.

## Data and trust boundaries

- Authentication passwords are stored as secure hashes by Supabase, not readable application records.
- Public profile fields include username, display name, bio and avatar; account email is not part of the public profile table.
- Server-only service credentials and AI keys never belong in browser code or illustration files.
- The owner alias is not a master key, a separate local identity, or a site-wide moderation role.
- Signed-in contributions are attached to stable account UUIDs and stored in Supabase across logouts and deployments.
- Browser-only demonstration changes made before connecting Supabase are a separate local demo mode.

## Example invention path

Low-cost water monitoring → low-power turbidity sensor + solar power module → solar-powered community water monitor.

The synthesis includes a concept, problem statement, mechanism, components, complementary strengths, conflicts, risks, and a suggested next contribution. AI output is a proposal requiring human review.

Current implementation snapshot: October 23, 2026.
