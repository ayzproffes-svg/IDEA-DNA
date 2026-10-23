// Private diagnostic only. Does not change any password or account data.
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");
process.loadEnvFile(".env.local");
(async () => {
  const path = ".owner-password.txt";
  const password = fs
    .readFileSync(path, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r?\n$/, "");
  if (!password)
    throw Error("Enter the password you are trying in .owner-password.txt.");
  const id = process.env.IDEADNA_OWNER_USER_ID;
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const owner = await admin.auth.admin.getUserById(id);
  if (owner.error || !owner.data.user?.email)
    throw Error("Owner account could not be resolved.");
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const local = await client.auth.signInWithPassword({
    email: owner.data.user.email,
    password,
  });
  if (local.error) {
    console.log(
      "Exact password check: Supabase rejected this password. No account or password was changed.",
    );
    process.exitCode = 1;
    return;
  }
  if (local.data.user?.id !== id)
    throw Error("Unexpected identity; diagnostic stopped.");
  await client.auth.signOut({ scope: "local" });
  console.log(
    "Exact password check: Supabase accepted it for the existing owner account.",
  );
  const r = await fetch("https://ideadna.vercel.app/api/auth/owner-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://ideadna.vercel.app",
    },
    body: JSON.stringify({ identifier: "admin1", password }),
    signal: AbortSignal.timeout(25000),
  });
  console.log(
    "Live admin1 sign-in: HTTP " +
      r.status +
      "; session cookie: " +
      Boolean(r.headers.get("set-cookie")),
  );
  if (!r.ok) {
    process.exitCode = 1;
    return;
  }
  console.log("End-to-end owner sign-in passed.");
})()
  .catch((e) => {
    console.log("Private diagnostic failed: " + e.message);
    process.exitCode = 1;
  })
  .finally(() => {
    try {
      if (fs.existsSync(".owner-password.txt"))
        fs.writeFileSync(".owner-password.txt", "");
      console.log("Temporary password file cleared.");
    } catch {
      console.log("Clear the temporary password file manually.");
    }
  });
