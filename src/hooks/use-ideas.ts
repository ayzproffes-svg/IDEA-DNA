"use client";
import { useEffect, useState, useCallback } from "react";
import { trees as seeds, demoNodes, people as seedPeople } from "@/lib/demo";
import { browserDB, configured as liveConfigured } from "@/lib/supabase/client";
import type { Tree, Idea, Person } from "@/types";
import { seedJudgeSandbox } from "@/lib/judge-demo";
export function useIdeas(slug?: string, workspace = false, demo = false) {
  const configured = liveConfigured && !demo;
  const prefix = demo ? "ideadna-judge-" : "ideadna-";
  const [trees, setTrees] = useState<Tree[]>(configured ? [] : seeds);
  const [nodes, setNodes] = useState<Idea[]>(configured ? [] : demoNodes);
  const [people, setPeople] = useState<Person[]>(configured ? [] : seedPeople);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!configured) return;
    try {
      const db = browserDB();
      let query = db
        .from("idea_trees")
        .select("*")
        .order("created_at", { ascending: false });
      if (slug) query = query.eq("slug", slug);
      else if (workspace) {
        const {
          data: { user },
        } = await db.auth.getUser();
        query = user
          ? query.or(`visibility.eq.public,creator_id.eq.${user.id}`)
          : query.eq("visibility", "public");
      } else query = query.eq("visibility", "public");
      const t = await query;
      const ids = (t.data || []).map((t) => t.id);
      const [n, p] = await Promise.all([
        ids.length
          ? db
              .from("idea_nodes")
              .select("*")
              .in("tree_id", ids)
              .eq("status", "published")
          : Promise.resolve({ data: [], error: null }),
        db.from("profiles").select("*").limit(500),
      ]);
      if (t.error || n.error || p.error) {
        setError(
          t.error?.message ||
            n.error?.message ||
            p.error?.message ||
            "Could not load ideas",
        );
        setReady(true);
        return;
      }
      setError("");
      setTrees(t.data as Tree[]);
      setNodes(n.data as Idea[]);
      setPeople(p.data as Person[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load ideas. Retry.");
    } finally {
      setReady(true);
    }
  }, [slug, workspace, configured]);
  useEffect(() => {
    if (configured) {
      const timeout = setTimeout(() => {
        setError("Loading took too long. Check your connection and retry.");
        setReady(true);
      }, 15000);
      void refresh().finally(() => clearTimeout(timeout));
      const db = browserDB();
      const c = db
        .channel("ideas-" + (slug || "explore"))
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "idea_nodes" },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "idea_trees" },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "node_reactions" },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "synthesis_requests" },
          refresh,
        )
        .subscribe();
      return () => {
        clearTimeout(timeout);
        void db.removeChannel(c);
      };
    }
    try {
      if (demo) seedJudgeSandbox();
      setTrees(
        JSON.parse(localStorage.getItem(prefix + "trees") || "null") || seeds,
      );
      setNodes(
        JSON.parse(localStorage.getItem(prefix + "nodes") || "null") ||
          demoNodes,
      );
      const p = JSON.parse(localStorage.getItem(prefix + "profile") || "null");
      if (p)
        setPeople(
          seedPeople.map((person) => (person.id === p.id ? p : person)),
        );
    } catch {}
    setReady(true);
  }, [refresh, slug, configured, prefix]);
  async function addNode(node: Idea) {
    if (configured) {
      const r = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(node),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      await refresh();
      return data as Idea;
    }
    const next = [...nodes, node];
    localStorage.setItem(prefix + "nodes", JSON.stringify(next));
    setNodes(next);
    return node;
  }
  async function updateNode(id: string, patch: Partial<Idea>) {
    if (configured) {
      const r = await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await refresh();
    } else {
      const old = nodes.find((n) => n.id === id);
      const revisions = JSON.parse(
        localStorage.getItem(prefix + "revisions") || "[]",
      );
      if (old)
        localStorage.setItem(
          prefix + "revisions",
          JSON.stringify([
            {
              ...old,
              node_id: id,
              reason: patch.change_reason || "",
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
            },
            ...revisions,
          ]),
        );
      const next = nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
      localStorage.setItem(prefix + "nodes", JSON.stringify(next));
      setNodes(next);
    }
  }
  async function addTree(tree: Tree, root: Idea) {
    if (configured) {
      const r = await fetch("/api/trees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tree, content: root.content }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await refresh();
      return;
    }
    localStorage.setItem(prefix + "trees", JSON.stringify([tree, ...trees]));
    localStorage.setItem(prefix + "nodes", JSON.stringify([...nodes, root]));
    setTrees([tree, ...trees]);
    setNodes([...nodes, root]);
  }
  return {
    resetDemo: () => {
      if (!demo) return;
      for (const suffix of [
        "trees",
        "nodes",
        "profile",
        "revisions",
        ...seeds.map((t) => "innovation-" + t.id),
        ...nodes.map((n) => "reaction-" + n.id),
      ])
        localStorage.removeItem("ideadna-judge-" + suffix);
      seedJudgeSandbox();
      setTrees([...seeds]);
      setNodes([...demoNodes]);
      setPeople([...seedPeople]);
      setError("");
    },
    trees,
    nodes,
    people,
    ready,
    error,
    addNode,
    updateNode,
    addTree,
    refresh,
  };
}
