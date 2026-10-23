# IdeaDNA — Prototype testing

## Purpose

Evaluate whether people can discover an idea, understand its branches, contribute meaningfully, combine two contributions, and recognize who deserves credit. This is a testing plan with a clearly identified evidence snapshot, not a report of a completed participant study.

## Iterative process

Define tasks → Run the prototype → Capture evidence → Improve → Retest

1. **Define tasks:** turn core journeys into realistic scenarios with observable completion criteria.
2. **Run the prototype:** test desktop, mobile, keyboard-only and assistive-technology paths. Use a connected development workspace for live service behavior.
3. **Capture evidence:** record completion, errors, task time, confusing steps and participant feedback. Never record passwords, tokens or private content.
4. **Improve:** prioritize blockers first, then recurring interaction problems and presentation issues. Connect each change to the evidence that motivated it.
5. **Retest:** repeat affected tasks and run regression checks for authentication, authorization, persistence and AI synthesis.

## Proposed formative study

Recruit 5–8 representative participants: first-time contributors, community-project organizers, and technically confident collaborators. This is a proposed sample for qualitative learning, not a completed study or a statistically representative sample.

Explain the study, obtain consent, use fictional tasks and demonstration data, and let participants stop at any time. Ask them to think aloud. Test with ordinary accounts; do not share the owner's password. Record whether help was required and why.

## Task and acceptance matrix

| ID | Task | Proposed acceptance criterion | Current evidence |
| --- | --- | --- | --- |
| T1 | Find the water-monitoring tree | Participant locates it using browse/search/filter without guidance | Desktop discovery filtering checked; participant task pending |
| T2 | Sign in, leave and return | Correct account opens; an authenticated page is accessible | Live owner sign-in, session cookie and protected settings checked |
| T3 | Create a root idea | New tree and root persist after refresh under the same author | Transactional creation tested in PostgreSQL; full live UI task pending |
| T4 | Add a child contribution | Correct parent, relationship, author and content appear | Desktop demo contribution save and database creation checks completed |
| T5 | Edit or archive a contribution | Allowed editor succeeds; another ordinary user is denied | Database ownership and revision tests completed; full live UI task pending |
| T6 | Select two nodes and synthesize | Distinct sources produce a complete blueprint linked to both | Desktop selection, AI response/schema and database dual-edge checks completed; full live journey pending |
| T7 | Inspect attribution/history | Participant identifies author, parent and earlier content | History interface implemented; revision storage tested; participant comprehension pending |
| T8 | Respect privacy | Signed-out or unrelated accounts cannot read a private tree | Database access-policy tests completed; broader independent review pending |
| T9 | Collaborate across two browsers | A new authorized contribution reaches the other client and survives refresh | Realtime subscription code implemented; two-browser transport check pending |
| T10 | Upload an avatar | Supported image succeeds; invalid file type/size is rejected | Storage bucket and policies installed; full live upload task pending |
| T11 | Use a phone and keyboard | Main tasks remain operable with clear focus and readable content | Responsive/focus code implemented; final mobile/keyboard/screen-reader pass pending |
| T12 | Recover from errors | Expired confirmation, wrong password, provider failure and quota errors give useful next steps | Auth tests and live invalid-password rejection checked; broader failure-recovery task pending |

## Evidence to collect

- Task completion: independent, with assistance, or incomplete.
- Time per task: actual measured duration; no baseline is claimed yet.
- Errors: wrong selections, validation failures, navigation mistakes and recovery attempts.
- Qualitative feedback: unclear terminology, missing context, trust in attribution and AI usefulness.
- Accessibility observations: keyboard reachability, focus order, names/labels, zoom, contrast and screen-reader output.
- Optional post-task ease rating on a defined scale; report responses only after collecting them.

## Verified so far

- Strict TypeScript checks and optimized production builds.
- Input/AI-schema validation and auth callback tests.
- PostgreSQL tests for public/private visibility, ownership, cross-tree rejection, immutable attribution, revisions, reaction scores, dual synthesis edges and request limits.
- Preliminary desktop graph interactions, topical filtering, demo contribution save and two-node selection.
- Live public API responses and owner login with session cookies and access to protected settings.
- Live temporary-account token confirmation and sign-in; that test account was removed afterward and no test email was sent.

## Proposed next tests

Complete the formative participant study, final mobile and assistive-technology pass, two-browser realtime exercise, signed-in project persistence round trip, avatar upload, and full live synthesis save. Exercise email delivery with a configured custom SMTP sender; the built-in sender has testing restrictions and a very low project-wide quota.

## Release gate

The proposed release gate is: no unresolved critical blockers; main tasks can be completed; private data stays protected; visible changes persist to the correct account; and failures have useful recovery paths. The gate is an acceptance criterion, not a claim that every pending check has passed.

Current evidence snapshot: October 23, 2026. No participant results, completion percentages or task-time measurements have been fabricated.
