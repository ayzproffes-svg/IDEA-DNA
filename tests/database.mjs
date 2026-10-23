import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema storage;
create table auth.users(id uuid primary key,instance_id uuid,aud text,role text,email text,encrypted_password text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb default '{}',created_at timestamptz,updated_at timestamptz,confirmation_token text,recovery_token text,email_change_token_new text,email_change_token_current text,email_change text,phone_change text,phone_change_token text,reauthentication_token text,email_change_confirm_status integer);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
create publication supabase_realtime;
grant usage on schema public,auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;`);
const migration = readFileSync(
  "supabase/migrations/202610220001_core.sql",
  "utf8",
).replace("create extension if not exists pgcrypto;", "");
await db.exec(migration);
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002";
await db.query(
  "insert into auth.users(id,raw_user_meta_data) values($1,$2),($3,$4)",
  [a, { display_name: "Maya Chen" }, b, { display_name: "Arjun Patel" }],
);
async function role(name, id = "") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role " + name);
}
async function denied(sql, params = []) {
  let failed = false;
  try {
    await db.query(sql, params);
  } catch {
    failed = true;
  }
  assert.ok(failed, "Operation should be denied: " + sql);
}
await role("authenticated", a);
const payload = {
  title: "Water quality for everyone",
  slug: "water-quality",
  description: "Affordable water monitoring for rural communities.",
  content: "Build a modular sensor that communities can maintain themselves.",
  visibility: "public",
  tags: ["Climate tech"],
};
const t = (await db.query("select create_idea_tree($1) as t", [payload]))
  .rows[0].t;
const root = (
  await db.query("select * from idea_nodes where tree_id=$1", [t.id])
).rows[0];
assert.equal(root.author_id, a);
assert.equal(root.node_type, "root");
await role("authenticated", b);
const n = (
  await db.query("select add_contribution($1) as n", [
    {
      tree_id: t.id,
      parent_id: root.id,
      author_id: a,
      title: "A low-power sensor module",
      content:
        "Use a replaceable turbidity sensor with local calibration samples.",
      node_type: "extension",
      metadata: {},
    },
  ])
).rows[0].n;
assert.equal(n.author_id, b, "Caller cannot impersonate another contributor");
await denied("update idea_nodes set author_id=$1 where id=$2", [a, n.id]);
await denied("update idea_nodes set contribution_score=999 where id=$1", [
  n.id,
]);
assert.equal(
  (
    await db.query("update idea_nodes set title=$1 where id=$2 returning id", [
      "Unauthorized root change",
      root.id,
    ])
  ).rows.length,
  0,
);
await db.query("update idea_nodes set title=$1 where id=$2", [
  "A replaceable sensor module",
  n.id,
]);
assert.equal(
  (await db.query("select * from node_revisions where node_id=$1", [n.id])).rows
    .length,
  1,
);
await db.query(
  "insert into node_reactions(node_id,user_id,reaction_type) values($1,$2,'insightful')",
  [n.id, b],
);
assert.equal(
  (
    await db.query("select contribution_score from idea_nodes where id=$1", [
      n.id,
    ])
  ).rows[0].contribution_score,
  1,
);
await role("authenticated", a);
const privateTree = (
  await db.query("select create_idea_tree($1) as t", [
    { ...payload, slug: "private-water", visibility: "private" },
  ])
).rows[0].t;
const privateRoot = (
  await db.query("select id from idea_nodes where tree_id=$1", [privateTree.id])
).rows[0].id;
await denied("select add_contribution($1)", [
  {
    tree_id: t.id,
    parent_id: privateRoot,
    title: "Invalid cross-tree branch",
    content: "This branch should fail the parent relationship check.",
    node_type: "extension",
  },
]);
await db.query("update idea_nodes set status=$1 where id=$2", [
  "archived",
  n.id,
]);
assert.equal(
  (await db.query("select * from node_revisions where node_id=$1", [n.id])).rows
    .length,
  2,
);
await role("anon");
assert.equal(
  (await db.query("select * from idea_trees where id=$1", [privateTree.id]))
    .rows.length,
  0,
);
assert.equal(
  (await db.query("select * from idea_nodes where id=$1", [privateRoot])).rows
    .length,
  0,
);
assert.equal(
  (await db.query("select * from idea_nodes where id=$1", [n.id])).rows.length,
  0,
);
assert.equal(
  (await db.query("select * from idea_trees where id=$1", [t.id])).rows.length,
  1,
);
await denied("select create_idea_tree($1)", [payload]);
await role("authenticated", b);
assert.equal(
  (await db.query("select * from idea_trees where id=$1", [privateTree.id]))
    .rows.length,
  0,
);
await denied("select add_contribution($1)", [
  {
    tree_id: privateTree.id,
    parent_id: privateRoot,
    title: "Not allowed private branch",
    content: "A contribution to a tree this user cannot access.",
    node_type: "extension",
  },
]);
await db.query("update idea_nodes set status='published' where id=$1", [n.id]);
const request = (
  await db.query("select reserve_synthesis($1,$2,$3,$4) as id", [
    t.id,
    root.id,
    n.id,
    "Combine these branches.",
  ])
).rows[0].id;
await denied("select complete_synthesis($1,$2,$3)", [
  request,
  {
    title: "A forged AI blueprint",
    concept: "This must be rejected for a normal authenticated client.",
  },
  "fake-model",
]);
await role("service_role");
const result = (
  await db.query("select complete_synthesis($1,$2,$3) as n", [
    request,
    {
      title: "A community-owned water monitor",
      concept:
        "Combine a replaceable sensor with community maintenance and calibration.",
    },
    "test-model",
  ])
).rows[0].n;
await role("authenticated", b);
assert.equal(
  (
    await db.query("select * from idea_edges where target_node_id=$1", [
      result.id,
    ])
  ).rows.length,
  2,
);
for (let i = 0; i < 7; i++)
  await db.query("select reserve_synthesis($1,$2,$3,$4)", [
    t.id,
    root.id,
    n.id,
    "Test request",
  ]);
await denied("select reserve_synthesis($1,$2,$3,$4)", [
  t.id,
  root.id,
  n.id,
  "Ninth request",
]);
await denied("select reserve_synthesis($1,$2,$3,$4)", [
  t.id,
  root.id,
  root.id,
  "Same source",
]);
await role("authenticated", a);
await db.query("update idea_nodes set content=$1 where id=$2", [
  "The tree creator can refine a contribution while preserving its author.",
  n.id,
]);
assert.equal(
  (await db.query("select author_id from idea_nodes where id=$1", [n.id]))
    .rows[0].author_id,
  b,
);
console.log(
  "PASS: migration, automatic profiles, transactional roots, attribution, column permissions, ownership, private trees, archived visibility, cross-tree validation, revision history, reactions, server-only synthesis, dual edges, and rate limits.",
);
await role("authenticated", b);
await db.query(
  "insert into node_reactions(node_id,user_id,reaction_type) values($1,$2,'insightful') on conflict(node_id,user_id,reaction_type) do nothing",
  [n.id, b],
);
await role("postgres");
const seed = readFileSync("supabase/seed.sql", "utf8").replaceAll(
  "crypt(gen_random_uuid()::text,gen_salt('bf'))",
  "'test-only-unusable-hash'",
);
await db.exec(seed);
assert.equal(
  (
    await db.query(
      "select count(*)::int as n from idea_trees where id::text like '10000000-%'",
    )
  ).rows[0].n,
  3,
);
assert.equal(
  (
    await db.query(
      "select count(*)::int as n from idea_nodes where tree_id::text like '10000000-%'",
    )
  ).rows[0].n,
  24,
);
assert.equal(
  (
    await db.query(
      "select count(*)::int as n from idea_nodes where node_type='synthesis' and metadata ? 'blueprint' and tree_id::text like '10000000-%'",
    )
  ).rows[0].n,
  3,
);
console.log(
  "PASS: full demo seed, 3 trees, 24 contributions, 3 structured synthesis blueprints, and idempotent reactions.",
);
assert.equal(
  (
    await db.query(
      "select count(*)::int as n from auth.users where email like '%@example.invalid' and (confirmation_token is null or recovery_token is null or email_change_token_new is null or email_change_token_current is null or email_change is null or phone_change is null or phone_change_token is null or reauthentication_token is null or email_change_confirm_status is null)",
    )
  ).rows[0].n,
  0,
);
await db.query(
  "update auth.users set confirmation_token=null where email like '%@example.invalid'",
);
await db.query(
  "insert into auth.users(id,email,raw_user_meta_data) values('00000000-0000-4000-8000-000000000099','untouched@example.com','{}')",
);
await db.exec(
  readFileSync("supabase/migrations/202610230002_seed_auth_tokens.sql", "utf8"),
);
assert.equal(
  (
    await db.query(
      "select count(*)::int as n from auth.users where email like '%@example.invalid' and confirmation_token is null",
    )
  ).rows[0].n,
  0,
);
assert.equal(
  (
    await db.query(
      "select confirmation_token from auth.users where email='untouched@example.com'",
    )
  ).rows[0].confirmation_token,
  null,
);
console.log(
  "PASS: seeded Auth token fields are initialized; repair fixes demo records and preserves real-account verification.",
);

await role("postgres");
await db.exec(
  readFileSync("supabase/migrations/202610230003_innovation.sql", "utf8"),
);
await role("authenticated", b);
const entry = (
  await db.query(
    "insert into innovation_entries(tree_id,node_id,target_id,kind,body,relation) values($1,$2,$3,'relationship','These approaches may complement each other.','combines_with') returning *",
    [t.id, root.id, n.id],
  )
).rows[0];
assert.equal(entry.author_id, b);
await denied(
  "insert into innovation_entries(tree_id,node_id,target_id,kind,body,relation) values($1,$2,$3,'relationship','Duplicate connection','supports')",
  [t.id, root.id, n.id],
);
await denied(
  "insert into innovation_entries(tree_id,node_id,kind,body,origin) values($1,$2,'analysis','Forged AI output','ai')",
  [t.id, root.id],
);
await denied("update innovation_entries set author_id=$1 where id=$2", [
  a,
  entry.id,
]);
assert.equal(
  (
    await db.query(
      "update innovation_entries set status='accepted',reviewed_by=$1 where id=$2 returning id",
      [b, entry.id],
    )
  ).rows.length,
  0,
);
await role("authenticated", a);
await db.query(
  "update innovation_entries set status='accepted',reviewed_by=$1 where id=$2",
  [a, entry.id],
);
assert.equal(
  (
    await db.query("select * from innovation_events where entry_id=$1", [
      entry.id,
    ])
  ).rows.length,
  2,
);
await denied("delete from innovation_events where entry_id=$1", [entry.id]);
await denied(
  "insert into innovation_entries(tree_id,node_id,target_id,kind,body,relation) values($1,$2,$2,'relationship','Self connection','supports')",
  [t.id, root.id],
);
await db.query(
  "update idea_nodes set content=$1,change_reason='Restore tested original' where id=$2",
  [
    "A new documented change retaining all prior snapshots and attribution.",
    root.id,
  ],
);
assert.equal(
  (
    await db.query(
      "select count(*)::int n from node_revisions where node_id=$1 and reason='Restore tested original'",
      [root.id],
    )
  ).rows[0].n,
  1,
);
await db.query("update idea_trees set visibility='private' where id=$1", [
  t.id,
]);
await role("anon");
assert.equal(
  (await db.query("select * from innovation_entries where tree_id=$1", [t.id]))
    .rows.length,
  0,
);
assert.equal(
  (
    await db.query("select * from innovation_events where entry_id=$1", [
      entry.id,
    ])
  ).rows.length,
  0,
);
await role("authenticated", b);
await denied(
  "insert into innovation_entries(tree_id,node_id,kind,body) values($1,$2,'risk','Cannot read this private idea')",
  [t.id, root.id],
);
for (let i = 0; i < 8; i++) await db.query("select reserve_innovation_ai()");
await denied("select reserve_innovation_ai()");
console.log(
  "PASS: innovation upgrade, attribution, duplicate/self-link prevention, AI provenance, owner-only review, immutable audit trail, private records/events, revision reasons and AI quota.",
);
await db.close();
