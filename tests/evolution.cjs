const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
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
const { lineage, sources, compareText } = load("src/lib/evolution.ts");
const fixtureStore = new Map([["ideadna-nodes", "real-user-data"]]);
global.localStorage = { getItem: k=>fixtureStore.get(k) ?? null, setItem: (k,v)=>fixtureStore.set(k,v) };
const fixtures=load("src/lib/judge-demo.ts",name=>name==="@/lib/demo"?load("src/lib/demo.ts"):require(name));
fixtures.seedJudgeSandbox();
assert.equal(JSON.parse(fixtureStore.get("ideadna-judge-innovation-10000000-0000-4000-8000-000000000001")).length,2);
fixtureStore.set("ideadna-judge-revisions","[]");
fixtures.seedJudgeSandbox();
assert.equal(fixtureStore.get("ideadna-judge-revisions"),"[]", "Repeated initialization preserves demo edits");
assert.equal(fixtureStore.get("ideadna-nodes"),"real-user-data", "Initialization cannot overwrite real user storage");
delete global.localStorage;
const make = (id, parent_id = null, metadata = {}) => ({
  id,
  parent_id,
  metadata,
});
const nodes = [
  make("root"),
  make("a", "root"),
  make("b", "root"),
  make("merged", "a", { sources: ["a", "b"] }),
  make("last", "merged"),
];
assert.deepEqual(
  [...lineage(nodes, "merged", "ancestors")].sort(),
  ["merged", "a", "b", "root"].sort(),
);
assert.deepEqual(
  [...lineage(nodes, "b", "descendants")].sort(),
  ["b", "merged", "last"].sort(),
);
assert.equal(
  lineage([make("a", "b"), make("b", "a")], "a", "ancestors").size,
  2,
);
assert.deepEqual(sources(nodes[3]), ["a", "b"]);
assert.deepEqual(compareText("the old sensor works", "the new sensor works"), {
  unchanged: "the",
  removed: "old",
  added: "new",
  suffix: "sensor works",
});
assert.equal(compareText("same text", "same text").added, "");
const { entryInput } = load("src/lib/validations/innovation.ts");
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002";
const v = {
  tree_id: a,
  node_id: a,
  target_id: b,
  kind: "relationship",
  body: "Supports this concept",
  relation: "supports",
};
assert(entryInput.safeParse(v).success);
assert(!entryInput.safeParse({ ...v, target_id: a }).success);
assert(!entryInput.safeParse({ ...v, target_id: null }).success);
assert(
  !entryInput.safeParse({ ...v, source_url: "javascript:alert(1)" }).success,
);
console.log(
  "PASS: multi-source ancestry, descendants, cycle handling, changed-span comparison, relationship validation and unsafe reference rejection.",
);
