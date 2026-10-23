const fs = require("node:fs"),
  ts = require("typescript"),
  assert = require("node:assert/strict");
function load(path, resolve = require) {
  const m = { exports: {} };
  new Function(
    "exports",
    "require",
    "module",
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  )(m.exports, resolve, m);
  return m.exports;
}
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002";
let allowed = true,
  rows = [{ id: a, title: "Sample idea", content: "Public test content" }],
  quotaError = null,
  saved = null,
  providerCalls = 0,
  malformed = false;
class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const api = {
  context: async () => {
    if (!allowed) throw new ApiError("Sign in", 401);
    return {
      user: { id: b },
      db: {
        from: () => ({
          select() {
            return this;
          },
          eq() {
            return this;
          },
          in: async () => ({ data: rows }),
        }),
        rpc: async () => ({ error: quotaError }),
      },
    };
  },
  sameOrigin: (r) => {
    if (r.headers.get("origin") !== "https://example.test")
      throw new ApiError("Forbidden", 403);
  },
  readJSON: (r) => r.json(),
  ApiError,
  failure: (e) =>
    Response.json({ error: e.message }, { status: e.status || 400 }),
};
const { POST } = load("src/app/api/innovation/analyze/route.ts", (name) =>
  name === "next/server"
    ? { NextResponse: { json: Response.json } }
    : name === "@/lib/api"
      ? api
      : name === "@/lib/validations/innovation"
        ? load("src/lib/validations/innovation.ts")
        : name === "@/lib/supabase/admin"
          ? {
              adminDB: () => ({
                from: () => ({
                  insert: (v) => {
                    saved = v;
                    return {
                      select: () => ({
                        single: async () => ({ data: { id: a, ...v } }),
                      }),
                    };
                  },
                }),
              }),
            }
          : require(name),
);
const request = (ids = [a]) =>
  new Request("https://example.test/api/innovation/analyze", {
    method: "POST",
    headers: {
      origin: "https://example.test",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tree_id: a, node_ids: ids }),
  });
const originalFetch = global.fetch;
const oldEnv = Object.fromEntries(
  [
    "GROQ_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
  ].map((k) => [k, process.env[k]]),
);
(async () => {
  try {
    process.env.GROQ_API_KEY = "test-only";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only";
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    global.fetch = async () => {
      providerCalls++;
      return Response.json({
        choices: [
          {
            message: {
              content: malformed
                ? "not json"
                : JSON.stringify({
                    summary: "Preliminary sample analysis",
                    similarities: [],
                    differences: [],
                    contradictions: ["Calibration is unverified."],
                    recommendations: ["Test calibration."],
                    questions: ["How much drift?"],
                    relation: "supports",
                  }),
            },
          },
        ],
      });
    };
    allowed = false;
    assert.equal((await POST(request())).status, 401);
    assert.equal(providerCalls, 0);
    allowed = true;
    rows = [];
    assert.equal((await POST(request())).status, 404);
    assert.equal(providerCalls, 0);
    rows = [{ id: a, title: "Sample idea", content: "Public test content" }];
    quotaError = { message: "limit" };
    assert.equal((await POST(request())).status, 429);
    assert.equal(providerCalls, 0);
    quotaError = null;
    assert.equal((await POST(request())).status, 200);
    assert.equal(saved.author_id, b);
    assert.equal(saved.origin, "ai");
    assert.equal(saved.status, "proposed");
    assert.equal(saved.kind, "analysis");
    rows.push({
      id: b,
      title: "Second idea",
      content: "Another public test sample",
    });
    assert.equal((await POST(request([a, b]))).status, 200);
    assert.equal(saved.target_id, b);
    assert.equal(saved.kind, "relationship");
    malformed = true;
    assert.equal((await POST(request([a, b]))).status, 503);
    assert.equal((await POST(request([a, a]))).status, 400);
    console.log(
      "PASS: AI endpoint authentication, source access, quota, preliminary provenance, relationship sources and malformed-provider recovery (mocked provider; no external requests).",
    );
  } finally {
    global.fetch = originalFetch;
    for (const [k, v] of Object.entries(oldEnv))
      v === undefined ? delete process.env[k] : (process.env[k] = v);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
