// One-time setup for the account owner. Never run from a public API endpoint.
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");
process.loadEnvFile(".env.local");
async function main() {
  const password = process.env.IDEADNA_OWNER_PASSWORD;
  if (!password)
    throw Error("Set IDEADNA_OWNER_PASSWORD privately in .env.local first.");
  if (password.length < 16 || Buffer.byteLength(password, "utf8") > 72)
    throw Error(
      "Use at least 16 characters and no more than 72 UTF-8 bytes for the owner password.",
    );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error)
    throw Error(
      "Could not list accounts. Complete the demo-account repair before setup.",
    );
  const candidates = listed.data.users.filter(
    (user) => !/^00000000-0000-4000-8000-00000000000[1-4]$/.test(user.id),
  );
  const owner = process.env.IDEADNA_OWNER_USER_ID
    ? candidates.find((user) => user.id === process.env.IDEADNA_OWNER_USER_ID)
    : candidates.length === 1
      ? candidates[0]
      : null;
  if (!owner?.email)
    throw Error(
      "Cannot safely choose the existing owner account. Set IDEADNA_OWNER_USER_ID explicitly; no account was changed.",
    );
  const claimed = await admin
    .from("profiles")
    .select("id")
    .eq("username", "admin1")
    .maybeSingle();
  if (claimed.error) throw Error("Could not check username availability.");
  if (claimed.data && claimed.data.id !== owner.id)
    throw Error(
      "admin1 is already used by another account. No password was changed.",
    );
  const before = await Promise.all([
    admin.from("idea_trees").select("id").eq("creator_id", owner.id),
    admin.from("idea_nodes").select("id").eq("author_id", owner.id),
  ]);
  if (before.some((result) => result.error))
    throw Error(
      "Could not verify existing project ownership. No account was changed.",
    );
  // Deliberately preserve the same UUID, email, metadata, and all project ownership.
  // This account gets no site-wide role or service-role access.
  const updated = await admin.auth.admin.updateUserById(owner.id, {
    password,
    email_confirm: true,
  });
  if (updated.error)
    throw Error("Supabase could not update the owner password.");
  const profile = await admin
    .from("profiles")
    .update({ username: "admin1" })
    .eq("id", owner.id)
    .select("id")
    .single();
  if (profile.error)
    throw Error(
      "Password was set but profile alias could not be saved. Retry setup after resolving profile access.",
    );
  const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const login = await client.auth.signInWithPassword({
    email: owner.email,
    password,
  });
  if (login.error || login.data.user?.id !== owner.id)
    throw Error("Owner sign-in verification failed.");
  await client.auth.signOut({ scope: "local" });
  let file = fs.readFileSync(".env.local", "utf8");
  file = file.replace(/^IDEADNA_OWNER_PASSWORD=.*(?:\r?\n|$)/m, "");
  const line = "IDEADNA_OWNER_USER_ID=" + owner.id;
  file = /^IDEADNA_OWNER_USER_ID=/m.test(file)
    ? file.replace(/^IDEADNA_OWNER_USER_ID=.*$/m, line)
    : file + "\n" + line + "\n";
  fs.writeFileSync(".env.local", file);
  console.log(
    "admin1 now signs in to the existing owner account. Verification passed.",
  );
  console.log(
    "Preserved " +
      before[0].data.length +
      " owned trees and " +
      before[1].data.length +
      " authored contributions.",
  );
  console.log(
    "Temporary plaintext setup password removed from .env.local. No password was logged or stored in source code.",
  );
}
module.exports = { main };
if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
