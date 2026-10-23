const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const ownerId = "00000000-0000-4000-8000-000000000099";
const ownerEmail = "owner@example.com";
let signedInId = ownerId,
  loginError = null,
  logout = false,
  lookupCalls = 0;
const server = {
  auth: {
    signInWithPassword: async (credentials) => {
      assert.equal(credentials.email, ownerEmail);
      return { data: { user: { id: signedInId } }, error: loginError };
    },
    signOut: async () => {
      logout = true;
      return { error: null };
    },
  },
};
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
const dependencies = {
  sameOrigin: (r) => {
    if (r.headers.get("origin") !== "https://ideadna.vercel.app")
      throw new ApiError("Forbidden", 403);
  },
  readJSON: (r) => r.json(),
  ApiError,
  failure: (e) =>
    Response.json({ error: e.message }, { status: e.status || 500 }),
};
const m = { exports: {} };
new Function(
  "exports",
  "require",
  "module",
  ts.transpileModule(
    fs.readFileSync("src/app/api/auth/owner-login/route.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(
  m.exports,
  (name) => {
    if (name === "next/server")
      return {
        NextResponse: { json: (body, options) => Response.json(body, options) },
      };
    if (name === "@/lib/api") return dependencies;
    if (name === "@/lib/supabase/server")
      return { serverDB: async () => server };
    if (name === "@/lib/supabase/admin")
      return {
        adminDB: () => ({
          auth: {
            admin: {
              getUserById: async (id) => {
                lookupCalls++;
                assert.equal(id, ownerId);
                return { data: { user: { email: ownerEmail } }, error: null };
              },
            },
          },
        }),
      };
    return require(name);
  },
  m,
);
async function request(body, origin = "https://ideadna.vercel.app") {
  return m.exports.POST(
    new Request("https://ideadna.vercel.app/api/auth/owner-login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(body),
    }),
  );
}
(async () => {
  process.env.IDEADNA_OWNER_USER_ID = ownerId;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-placeholder";
  let r = await request({
    identifier: "admin1",
    password: "mock-password",
    user_id: "an-attacker-chosen-id",
  });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(r.headers.get("cache-control"), "no-store");
  let calls = lookupCalls;
  r = await request({ identifier: "another-user", password: "mock-password" });
  assert.equal(r.status, 401);
  assert.equal(lookupCalls, calls);
  r = await request(
    { identifier: "admin1", password: "mock-password" },
    "https://untrusted.invalid",
  );
  assert.equal(r.status, 403);
  loginError = { status: 400, message: "Detailed upstream error" };
  r = await request({ identifier: "admin1", password: "wrong" });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).error, "Invalid login credentials.");
  loginError = { status: 429 };
  r = await request({ identifier: "admin1", password: "wrong" });
  assert.equal(r.status, 429);
  loginError = null;
  signedInId = "wrong-account";
  r = await request({ identifier: "admin1", password: "mock-password" });
  assert.equal(r.status, 401);
  assert.equal(logout, true);
  delete process.env.IDEADNA_OWNER_USER_ID;
  r = await request({ identifier: "admin1", password: "mock-password" });
  assert.equal(r.status, 503);
  console.log(
    "PASS: owner alias resolves only the configured existing account; origin validation, credential validation, no token exposure, no-store responses, rate limits, and identity mismatch rejection.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
