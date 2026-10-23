const fs = require("node:fs");
const ts = require("typescript");
const source = fs.readFileSync("src/lib/demo.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const m = { exports: {} };
new Function("exports", "require", "module", compiled)(m.exports, require, m);
const { trees, people, demoNodes } = m.exports;
const quote = (s) => "'" + String(s).replaceAll("'", "''") + "'";
const json = (o) => quote(JSON.stringify(o)) + "::jsonb";
let sql =
  "-- Local/demo data only. Sample accounts have random, unknown passwords.\n-- The auth trigger creates profiles. Do not seed a live production project.\nbegin;\n";
for (const p of people) {
  sql += `insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change_token_current,email_change,phone_change,phone_change_token,reauthentication_token,email_change_confirm_status) values('${p.id}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','${p.username}@example.invalid',crypt(gen_random_uuid()::text,gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}',${json({ display_name: p.display_name })},now(),now(),'','','','','','','','',0) on conflict(id) do nothing;\n`;
  sql += `update public.profiles set username=${quote(p.username)},display_name=${quote(p.display_name)},bio=${quote(p.bio)} where id='${p.id}';\n`;
}
for (const t of trees) {
  sql += `insert into public.idea_trees(id,title,slug,description,creator_id,visibility,tags,created_at) values('${t.id}',${quote(t.title)},${quote(t.slug)},${quote(t.description)},'${t.creator_id}','public',array[${t.tags.map(quote).join(",")}],'${t.created_at}') on conflict(id) do nothing;\n`;
  const ns = demoNodes.filter((n) => n.tree_id === t.id);
  for (const n of ns) {
    if (n.node_type === "synthesis" && !n.metadata.blueprint)
      n.metadata = {
        sources: [ns[1].id, ns[2].id],
        model: "sample-blueprint",
        blueprint: {
          title: n.title,
          concept: n.content,
          problem_statement: t.description,
          proposed_mechanism:
            "Combine locally repairable hardware with a community-led deployment and maintenance plan.",
          key_components: [ns[1].title, ns[2].title, ns[3].title],
          complementary_strengths: [
            "Low infrastructure dependence",
            "Local ownership and repair",
          ],
          conflicts_and_constraints: [
            "Upfront costs must fit the pilot budget",
            "Maintenance needs a named local steward",
          ],
          risks_or_open_questions: [
            "Validate reliability in real operating conditions.",
          ],
          suggested_next_contribution:
            "Design a four-week pilot and publish a bill of materials.",
        },
      };
    sql += `insert into public.idea_nodes(id,tree_id,parent_id,author_id,title,content,node_type,status,metadata,created_at) values('${n.id}','${n.tree_id}',${n.parent_id ? quote(n.parent_id) : "null"},'${n.author_id}',${quote(n.title)},${quote(n.content)},'${n.node_type}','published',${json(n.metadata)},'${n.created_at}') on conflict(id) do nothing;\n`;
    if (n.parent_id) {
      const sources =
        n.node_type === "synthesis" ? n.metadata.sources : [n.parent_id];
      for (const p of sources)
        sql += `insert into public.idea_edges(source_node_id,target_node_id,relation,created_by) values('${p}','${n.id}','${{ extension: "extends", improvement: "improves", question: "challenges", constraint: "depends_on", synthesis: "synthesizes" }[n.node_type]}','${n.author_id}') on conflict(source_node_id,target_node_id) do nothing;\n`;
    }
    for (let i = 0; i < people.length; i++)
      if (people[i].id !== n.author_id)
        sql += `insert into public.node_reactions(node_id,user_id,reaction_type) values('${n.id}','${people[i].id}','${i % 2 ? "buildable" : "insightful"}') on conflict do nothing;\n`;
  }
  sql += `update public.idea_trees set root_node_id='${ns[0].id}' where id='${t.id}';\n`;
}
sql += "commit;\n";
fs.writeFileSync("supabase/seed.sql", sql);
console.log(
  "Generated 3 trees, 24 nodes, 4 sample contributors and their reactions.",
);

if (fs.existsSync("PRODUCT_COPY.md")) {
  const file = "PRODUCT_COPY.md";
  let copy = fs.readFileSync(file, "utf8").split("\n<!-- seed-copy -->")[0];
  copy += "\n<!-- seed-copy -->\n\n### Sample contributors\n\n";
  for (const p of people)
    copy += `**${p.display_name} (@${p.username})** — ${p.bio}\n\n`;
  for (const t of trees) {
    copy += `### ${t.title}\n\n${t.description}\n\nTopics: ${t.tags.join(", ")}.\n\n`;
    for (const n of demoNodes.filter((n) => n.tree_id === t.id))
      copy += `**${n.title}** (${n.node_type})\n\n${n.content}\n\n`;
  }
  fs.writeFileSync(file, copy);
}
