const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
let calls = [];
let authError = null;
const db = {
  auth: {
    verifyOtp: async (value) => {
      calls.push(["otp", value]);
      return { error: authError };
    },
    exchangeCodeForSession: async (value) => {
      calls.push(["code", value]);
      return { error: authError };
    },
  },
};
const m = { exports: {} };
const compiled = ts.transpileModule(
  fs.readFileSync("src/app/auth/callback/route.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
new Function("exports", "require", "module", compiled)(
  m.exports,
  (name) => {
    if (name === "next/server")
      return {
        NextResponse: {
          redirect: (url) =>
            new Response(null, {
              status: 307,
              headers: { Location: String(url) },
            }),
        },
      };
    if (name === "@/lib/supabase/server") return { serverDB: async () => db };
    return require(name);
  },
  m,
);
async function callback(query) {
  calls = [];
  const url = "https://ideadna.vercel.app/auth/callback" + query;
  return m.exports.GET({ url, nextUrl: new URL(url) });
}
(async () => {
  let r = await callback("?code=test-code");
  assert.equal(r.headers.get("location"), "https://ideadna.vercel.app/explore");
  assert.deepEqual(calls, [["code", "test-code"]]);
  r = await callback("?token_hash=test-hash&type=email");
  assert.equal(r.headers.get("location"), "https://ideadna.vercel.app/explore");
  assert.deepEqual(calls, [
    ["otp", { token_hash: "test-hash", type: "email" }],
  ]);
  r = await callback(
    "?token_hash=test-hash&type=signup&next=https://evil.invalid",
  );
  assert.equal(r.headers.get("location"), "https://ideadna.vercel.app/explore");
  r = await callback("?token_hash=test-hash&type=recovery");
  assert.equal(calls.length, 0);
  assert.equal(
    r.headers.get("location"),
    "https://ideadna.vercel.app/login?error=confirmation",
  );
  authError = { message: "expired" };
  r = await callback("?token_hash=expired&type=email");
  assert.equal(
    r.headers.get("location"),
    "https://ideadna.vercel.app/login?error=confirmation",
  );
  assert.ok(!r.headers.get("location").includes("expired"));
  console.log(
    "PASS: PKCE and token-hash confirmation, signup type, unsupported-token rejection, expiry feedback, and fixed internal redirects.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
