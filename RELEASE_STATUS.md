# IdeaDNA live upgrade — 23 October 2026

Production: https://ideadna.vercel.app
Judge demo: https://ideadna.vercel.app/demo
Vercel project: resolve18/ideadna
Deployment: dpl_5HtWoJQ7n5dZqimXh19HW7X1Hddd
Deployment URL: https://ideadna-djf160oep-resolve18.vercel.app
State: READY; main public domain switched successfully.

The user applied migration 202610230003_innovation.sql through Supabase SQL Editor. Both innovation_entries and innovation_events were confirmed available through the application's public client. The hosted innovation endpoint returned HTTP 200.

Final live checks:
- Home, demo and login: HTTP 200.
- Public tree and idea endpoints: HTTP 200, retaining 3 trees and 24 contributions.
- Innovation reads: HTTP 200.
- Signed-out writes and AI analysis: HTTP 401.
- Invalid owner credentials: HTTP 401.
- Existing admin1 browser session loaded the live workspace successfully.
- A real Groq analysis of the public water-monitoring root was generated and stored with origin=ai, kind=analysis, status=proposed under the signed-in owner. The original ideas were not edited.
- Live demo displays the labelled prewritten sample connection.
- All automated tests passed, including new fixture initialization/isolation checks.

Owner credentials, account identity and existing projects were preserved. The sample analysis remains a preliminary investigation aid, not validated research. The complete multi-user/private-project and merge journey has automated coverage but has not been fully repeated against production in this release.
