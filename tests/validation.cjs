const { readFileSync } = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const m = { exports: {} };
new Function(
  "exports",
  "require",
  "module",
  ts.transpileModule(readFileSync("src/lib/validations/index.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(m.exports, require, m);
const { nodeInput, treeInput, synthesisInput, blueprintSchema } = m.exports;
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002";
const n = {
  tree_id: a,
  parent_id: b,
  title: "A practical contribution",
  content: "A sufficiently detailed mechanism for an off-grid water sensor.",
  node_type: "extension",
  metadata: { links: ["https://example.com/source"] },
};
assert.ok(nodeInput.safeParse(n).success);
assert.ok(
  !nodeInput.safeParse({ ...n, metadata: { links: ["javascript:alert(1)"] } })
    .success,
);
assert.ok(!nodeInput.safeParse({ ...n, content: "too short" }).success);
assert.ok(!nodeInput.safeParse({ ...n, node_type: "synthesis" }).success);
assert.ok(!nodeInput.safeParse({ ...n, title: "x".repeat(141) }).success);
assert.ok(
  !synthesisInput.safeParse({
    tree_id: a,
    source_node_a_id: a,
    source_node_b_id: a,
  }).success,
);
assert.ok(
  synthesisInput.safeParse({
    tree_id: a,
    source_node_a_id: a,
    source_node_b_id: b,
  }).success,
);
assert.ok(
  !treeInput.safeParse({
    title: "A tree",
    slug: "bad/slug",
    description: "A sufficiently long tree description.",
    content: n.content,
    visibility: "public",
    tags: [],
  }).success,
);
assert.ok(
  !blueprintSchema.safeParse({
    title: "An invented blueprint",
    concept: "An answer without any required structured detail.",
  }).success,
);
console.log(
  "PASS: valid contributions, unsafe links, content/title bounds, synthesis-only creation, distinct sources, slug constraints, and structured AI output.",
);
