# Authentication confirmation update — October 23, 2026

Production: https://ideadna.vercel.app
Deployment: dpl_AMiFHAwPhVbGALZwVJ7pFq1Pcf5g

Changes:
- Callback accepts PKCE authorization codes and email/signup token hashes.
- `/auth/confirm` aliases `/auth/callback` for token-hash email templates.
- Failed or expired confirmations show a useful error and offer a fresh email.
- Login detects unconfirmed-account errors and exposes Resend confirmation email.
- Email-sending quota errors show a project-wide limit explanation and disable repeated resends on that page.
- New demo seeds initialize Auth string-token fields rather than leaving them NULL.
- `supabase/migrations/202610230002_seed_auth_tokens.sql` repairs only the four fictional demo accounts; it never changes real-account verification status.

Verified:
- TypeScript and validation/database tests passed.
- Auth callback unit tests cover PKCE, token hashes, allowed types, expired tokens, and internal redirects.
- Vercel production build passed.
- Live temporary synthetic account test: token-hash verification redirected to Explore; session cookie set; account confirmed; password sign-in passed. No emails were sent. Temporary account removed after testing.

Remaining:
- User must run the demo-account repair in Supabase SQL Editor. No direct SQL connection is available to the agent.
- The real user's account was pending email confirmation at the time of the check. Verification has not been bypassed.
- Built-in Supabase email delivery has a project-wide 2/hour quota and recipient restrictions. For public signup, configure a custom SMTP provider. The agent has not disabled verification or changed mail-provider settings.
- Exact reset time of the user's email quota is unknown; avoid repeated requests, then request one fresh link after the quota resets.

Sources:
https://supabase.com/docs/guides/auth/rate-limits
https://supabase.com/docs/guides/auth/auth-smtp
https://supabase.com/docs/guides/auth/auth-email-templates
