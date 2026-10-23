# IdeaDNA — Full evaluation

## Scope

Evaluate product behavior, safeguards, user experience, technical resilience, AI usefulness, and collaboration. The product is deployed and several checks have passed, but a complete external evaluation has not been performed. This document separates verified evidence from remaining evaluation.

## Evaluation loop

Collect evidence → Compare with criteria → Prioritize gaps → Improve → Re-evaluate

## 1. Functionality

**Question:** Can people complete the core journey?

**Assess:** discovery and filtering; account sign-in; root creation; child contributions; edits/archive; reactions; node details; source selection; synthesis; profiles; settings; persistence.

**Current evidence:** preliminary desktop graph/contribution checks; production API responses; validated request schemas; live owner authentication and protected-page access; PostgreSQL transaction tests.

**Further evaluation:** a complete signed-in create–edit–synthesize–refresh–logout–login journey in production or a staging project, including source attribution and saved results.

**Success criterion:** each supported task creates the expected durable state and offers an understandable recovery path on failure.

## 2. Security and privacy

**Question:** Does each person access only allowed data?

**Assess:** signed-out access, ordinary-user ownership, tree-creator permissions, private/unlisted/public visibility, profile/email separation, credential handling, input validation, file restrictions, and authentication/synthesis rate limits.

**Current evidence:** PostgreSQL RLS and column-permission tests; unauthorized ownership changes and cross-tree branches rejected; owner-login origin/identity checks tested; live wrong-password rejection; passwords checked by Supabase; server-only provider credentials.

**Further evaluation:** independent review of deployed configuration, broader abuse testing, session-expiry scenarios, email delivery configuration and an explicit review of storage policies. No penetration-test certification is claimed.

**Success criterion:** unauthorized reads/writes fail in the defined test matrix, secrets are absent from public assets, and the owner alias grants no additional site-wide permissions.

## 3. Usability and accessibility

**Question:** Can different people use it confidently?

**Assess:** discoverability, contribution terminology, graph legibility, source selection, attribution comprehension, mobile navigation, keyboard operation, focus visibility, screen-reader labels and error clarity.

**Current evidence:** preliminary desktop interaction and visual checks; responsive styles, labeled controls, keyboard graph inspection and focus-management code are implemented.

**Further evaluation:** a proposed 5–8-person formative study, a final mobile pass, keyboard-only testing, screen-reader checks and contrast/zoom review. This is not an accessibility certification or a completed user study.

**Success criterion:** participants complete core tasks without critical assistance and users of supported input methods can reach and operate necessary controls.

## 4. Performance and reliability

**Question:** Is the experience fast and resilient?

**Assess:** page loading, API latency, graph behavior at 20/50/100 nodes, synthesis duration, slow connections, provider/database failures, repeated requests, and data recovery after refresh.

**Current evidence:** optimized production builds passed and live pages/APIs returned successful responses. Provider calls have bounded timeouts; synthesis commits are transactional; failed requests are recorded.

**Further evaluation:** instrument page and API timings, report p50/p95 latency after actual measurements, load-test representative usage, and test failure recovery and graph scale. No numerical benchmark or latency result is claimed yet.

**Success criterion:** establish measurable targets after a baseline, then verify expected task responsiveness and absence of lost or partially committed contributions under the tested conditions.

## 5. AI blueprint quality

**Question:** Is the synthesis useful and grounded?

**Assess:** whether both sources influence the result; concept clarity; technical coherence; practical components; conflicts and constraints; risks; attribution; and a useful next experiment.

**Current evidence:** the live provider generated a blueprint that passed all required Zod fields. The database completion function was tested for a result connected to both sources. This is evidence of valid structure, not proof of invention quality.

**Further evaluation:** human review across the water-monitoring, tool-library and disaster-response examples; repeated generations; conflicting source pairs; prompt-injection attempts; and incomplete/invalid provider responses. The full production UI-to-result persistence journey remains to be verified.

**Proposed human rubric:** score each dimension from 1 (absent or misleading) to 5 (clear, relevant and actionable): source integration, clarity, feasibility, completeness, risk awareness and next-step usefulness. These are proposed rating anchors; no actual ratings have been collected.

**Success criterion:** reviewers can trace the hybrid idea to both sources, understand its constraints, and identify an actionable next test without mistaking AI claims for validated results.

## 6. Collaboration and attribution

**Question:** Does shared work preserve credit and history?

**Assess:** stable authorship, parent relationships, two-source synthesis provenance, prior-content revisions, reaction deduplication, authorized realtime delivery and simultaneous activity.

**Current evidence:** database tests cover original authorship preservation, revisions, unique reactions, both synthesis edges and request completion. Realtime subscriptions are implemented.

**Further evaluation:** two-browser participation, simultaneous edits, disconnect/reconnect, refresh persistence and participant comprehension of contribution history. Conflict-free concurrent editing is not claimed; revisions record prior versions, while edit behavior requires explicit concurrency testing.

**Success criterion:** contributions stay attributable, no tested action silently loses important history, and authorized clients see durable updates.

## Proposed weighted review rubric

| Criterion | Suggested weight | Evidence required before assigning a score |
| --- | --- | --- |
| Functionality | 25% | Completed end-to-end task matrix and persistence checks |
| Security and privacy | 25% | Role/visibility matrix, credential/configuration and storage review |
| Usability and accessibility | 15% | Participant observations and accessibility checks |
| Performance and reliability | 10% | Measured timings, graph-scale and failure-recovery evidence |
| AI blueprint quality | 15% | Recorded human ratings across representative examples |
| Collaboration and attribution | 10% | Two-browser/concurrency checks and history verification |
| Total | 100% | Proposed rubric only; no overall result has been assigned |

If ratings are later collected, calculate a weighted result using explicitly defined scale conversions and publish the underlying evidence. Do not turn the weights above into a completion percentage.

## Current assessment

IdeaDNA has an implemented and deployed foundation with verified compilation, database-policy behavior, basic graph interactions, structured provider output and live owner authentication. Public email delivery remains a launch dependency requiring custom SMTP. Formal usability, accessibility, load, concurrency, avatar-upload and complete live synthesis testing remain open.

The appropriate claim is **implemented product with preliminary verification and a defined evaluation plan**, not fully audited, fully accessibility-tested, load-certified or proven by user research.

Current evidence snapshot: October 23, 2026.
