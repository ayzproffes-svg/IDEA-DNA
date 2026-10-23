"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  type NodeProps,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Plus,
  Search,
  Sparkles,
  X,
  GitBranch,
  ThumbsUp,
  ChevronRight,
  GitMerge,
  EyeOff,
  History,
  ExternalLink,
} from "lucide-react";
import { useIdeas } from "@/hooks/use-ideas";

import { configured as liveConfigured, browserDB } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Idea, Kind, Person } from "@/types";
import { InnovationPanel } from "./innovation-panel";
import { lineage } from "@/lib/evolution";
type GraphData = {
  idea: Idea;
  person?: Person;
  onOpen: (id: string) => void;
  selected: boolean;
  collapsed: boolean;
  onCollapse: (id: string) => void;
};
function IdeaNode({ data }: NodeProps<Node<GraphData>>) {
  const p = data.person;
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={"Contribution: " + data.idea.title}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          data.onOpen(data.idea.id);
        }
      }}
      className={`idea-node kind-${data.idea.node_type} ${data.selected ? "picked" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="node-top">
        <span>
          {data.idea.node_type === "synthesis" ? (
            <Sparkles size={12} />
          ) : (
            <GitBranch size={12} />
          )}{" "}
          {data.idea.node_type}
        </span>
        <button
          aria-label={data.collapsed ? "Expand branch" : "Collapse branch"}
          className="nodrag"
          onClick={(e) => {
            e.stopPropagation();
            data.onCollapse(data.idea.id);
          }}
        >
          {data.collapsed ? "+" : "−"}
        </button>
      </div>
      <h3>{data.idea.title}</h3>
      <p>{data.idea.content.slice(0, 83)}…</p>
      <div className="node-bottom">
        <span className="avatar tiny-avatar">
          {p?.display_name
            .split(" ")
            .map((x) => x[0])
            .join("") || "YO"}
        </span>
        <span>{p?.display_name || "Contributor"}</span>
        <span>↑ {data.idea.contribution_score}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
const nodeTypes = { idea: IdeaNode };
export function TreeWorkspace({
  slug,
  nodeId,
  demo = false,
}: {
  slug: string;
  nodeId?: string;
  demo?: boolean;
}) {
  const configured = liveConfigured && !demo;
  const store = useIdeas(slug, false, demo);
  const [demoEpoch, setDemoEpoch] = useState(0);
  const [lineageMode, setLineageMode] = useState("all");
  const [flow, setFlow] = useState<ReactFlowInstance<
    Node<GraphData>,
    Edge
  > | null>(null);
  const [connections, setConnections] = useState<
    {
      id: string;
      node_id: string;
      target_id: string | null;
      kind: string;
      relation: string | null;
      status: string;
      origin: string;
    }[]
  >([]);
  const people = store.people;
  const tree = store.trees.find((t) => t.slug === slug);
  const nodes = store.nodes.filter(
    (n) => n.tree_id === tree?.id && n.status !== "archived",
  );
  const [focus, setFocus] = useState<string | null>(nodeId || null);
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [author, setAuthor] = useState("all");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [composer, setComposer] = useState<string | null>(null);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [synthesis, setSynthesis] = useState(false);
  const [intent, setIntent] = useState("");
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [user, setUser] = useState<string | null>(
    configured ? null : people[0].id,
  );
  const [revisions, setRevisions] = useState<
    {
      id: string;
      created_at: string;
      title: string;
      content: string;
      reason?: string;
    }[]
  >([]);
  const [reaction, setReaction] = useState<string | null>(null);
  useEffect(() => {
    if (configured)
      void browserDB()
        .auth.getUser()
        .then(({ data }) => setUser(data.user?.id || null));
  }, []);
  useEffect(() => {
    if (!focus) return;
    if (!configured) {
      try {
        setRevisions(
          JSON.parse(
            localStorage.getItem(
              demo ? "ideadna-judge-revisions" : "ideadna-revisions",
            ) || "[]",
          ).filter((r: { node_id: string }) => r.node_id === focus),
        );
      } catch {}
      return;
    }
    const db = browserDB();
    void db
      .from("node_revisions")
      .select("*")
      .eq("node_id", focus)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRevisions(data || []));
  }, [focus, store.nodes]);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStage((s) => Math.min(3, s + 1)), 1600);
    return () => clearInterval(t);
  }, [busy]);
  const selected = nodes.find((n) => n.id === focus);
  function toggleCollapse(id: string) {
    setCollapsed((c) =>
      c.includes(id) ? c.filter((x) => x !== id) : [...c, id],
    );
  }
  const graph = useMemo(() => {
    const hidden = new Set<string>();
    function hide(id: string) {
      nodes
        .filter((n) => n.parent_id === id)
        .forEach((n) => {
          if (!hidden.has(n.id)) {
            hidden.add(n.id);
            hide(n.id);
          }
        });
    }
    collapsed.forEach(hide);
    const path =
      focus && lineageMode !== "all"
        ? lineage(nodes, focus, lineageMode as "ancestors" | "descendants")
        : null;
    const visible = nodes.filter(
      (n) =>
        !hidden.has(n.id) &&
        (!path || path.has(n.id)) &&
        (kind === "all" || n.node_type === kind) &&
        (author === "all" || n.author_id === author) &&
        (!query ||
          `${n.title} ${n.content} ${Array.isArray(n.metadata.tags) ? n.metadata.tags.join(" ") : ""}`
            .toLowerCase()
            .includes(query.toLowerCase())),
    );
    const byId = new Map(nodes.map((n) => [n.id, n]));
    function depth(n: Idea, seen = new Set<string>()): number {
      if (!n.parent_id || seen.has(n.id)) return 0;
      seen.add(n.id);
      const p = byId.get(n.parent_id);
      return p ? depth(p, seen) + 1 : 0;
    }
    const levels = new Map<number, Idea[]>();
    visible.forEach((n) => {
      const d = depth(n);
      levels.set(d, [...(levels.get(d) || []), n]);
    });
    const flowNodes: Node<GraphData>[] = visible.map((n) => {
      const d = depth(n),
        row = levels.get(d)!;
      return {
        id: n.id,
        type: "idea",
        position: {
          x: (row.indexOf(n) - (row.length - 1) / 2) * 300,
          y: d * 260,
        },
        data: {
          idea: n,
          onOpen: (id: string) => {
            setFocus(id);
            setPicked((p) =>
              p.includes(id) ? p.filter((x) => x !== id) : [...p.slice(-1), id],
            );
          },
          person: people.find((p) => p.id === n.author_id),
          selected: picked.includes(n.id),
          collapsed: collapsed.includes(n.id),
          onCollapse: toggleCollapse,
        },
      };
    });
    const ancestry = focus
      ? lineage(nodes, focus, "ancestors")
      : new Set<string>();
    const edges: Edge[] = visible.flatMap((n) => {
      const parents =
        n.node_type === "synthesis" && Array.isArray(n.metadata.sources)
          ? (n.metadata.sources as string[])
          : n.parent_id
            ? [n.parent_id]
            : [];
      return parents
        .filter((p) => visible.some((x) => x.id === p))
        .map((p) => ({
          id: `${p}-${n.id}`,
          source: p,
          target: n.id,
          type: "smoothstep",
          animated: n.node_type === "synthesis",
          style: {
            stroke: n.node_type === "synthesis" ? "#d6bb7c" : "#477a6d",
            strokeWidth: ancestry.has(p) && ancestry.has(n.id) ? 3.5 : 1.4,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#477a6d" },
        }));
    });
    for (const e of connections)
      if (
        e.kind === "relationship" &&
        e.target_id &&
        ["proposed", "accepted"].includes(e.status) &&
        visible.some((n) => n.id === e.node_id) &&
        visible.some((n) => n.id === e.target_id)
      )
        edges.push({
          id: "review-" + e.id,
          source: e.node_id,
          target: e.target_id,
          type: "smoothstep",
          label:
            (e.status === "proposed" ? "Proposed: " : "Reviewed: ") +
            (e.relation || "").replaceAll("_", " "),
          style: {
            stroke: e.status === "accepted" ? "#88d9b9" : "#d6bb7c",
            strokeDasharray: e.status === "proposed" ? "6 5" : undefined,
          },
          labelStyle: { fill: "#cde4d7" },
        });
    return { nodes: flowNodes, edges };
  }, [
    nodes,
    query,
    kind,
    author,
    collapsed,
    picked,
    people,
    focus,
    lineageMode,
    connections,
  ]);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      const title = String(f.get("title")).trim(),
        content = String(f.get("content")).trim();
      const link = String(f.get("link") || "");
      if (link && !/^https?:\/\//.test(link))
        throw Error("Links must begin with https:// or http://");
      if (!user) throw Error("Sign in to contribute to this workspace.");
      if (editing) {
        await store.updateNode(editing.id, {
          title,
          content,
          change_reason: String(f.get("change_reason") || ""),
        });
        setEditing(null);
      } else {
        const relation = String(f.get("relation"));
        const node_type = (
          {
            extends: "extension",
            improves: "improvement",
            challenges: "question",
            depends_on: "constraint",
          } as Record<string, Kind>
        )[relation];
        await store.addNode({
          id: crypto.randomUUID(),
          tree_id: tree!.id,
          parent_id: composer,
          author_id: user,
          title,
          content,
          node_type,
          status: "published",
          contribution_score: 0,
          metadata: {
            relation,
            tags: String(f.get("tags") || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            links: link ? [link] : [],
          },
          created_at: new Date().toISOString(),
        });
      }
      setComposer(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    setBusy(true);
    setError("");
    setStage(0);
    try {
      if (!configured)
        throw Error(
          "AI synthesis needs a connected Supabase workspace and a server API key. You can inspect the sample synthesis node in this demo.",
        );
      const r = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tree_id: tree!.id,
          source_node_a_id: picked[0],
          source_node_b_id: picked[1],
          intent,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setResult(d.blueprint);
      await store.refresh();
      setFocus(d.node.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function react(type: string) {
    if (!selected) return;
    setError("");
    try {
      if (configured) {
        if (!user) throw Error("Sign in to react.");
        const db = browserDB();
        const { error } = await db.from("node_reactions").upsert(
          { node_id: selected.id, user_id: user, reaction_type: type },
          {
            onConflict: "node_id,user_id,reaction_type",
            ignoreDuplicates: true,
          },
        );
        if (error) throw error;
      } else {
        localStorage.setItem(
          (demo ? "ideadna-judge-reaction-" : "ideadna-reaction-") +
            selected.id,
          type,
        );
      }
      setReaction(type);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (!composer && !synthesis) return;
    const before = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    const timer = requestAnimationFrame(() =>
      (
        dialog?.querySelector<HTMLElement>("input,textarea") ||
        dialog?.querySelector<HTMLElement>("button")
      )?.focus(),
    );
    function key(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        setComposer(null);
        setEditing(null);
        setSynthesis(false);
      }
      if (e.key === "Tab" && dialog) {
        const all = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,textarea,select,a[href]",
          ),
        );
        const first = all[0],
          last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [composer, synthesis, busy]);
  if (!tree)
    return (
      <div className="page empty">
        <h1>
          {store.ready
            ? store.error || "Tree not found"
            : "Opening the workspace…"}
        </h1>
        <Link href="/explore">Back to explore</Link>
      </div>
    );
  return (
    <div className="tree-workspace">
      <div className="tree-heading">
        <Link href="/explore" className="back-link">
          <ArrowLeft size={14} /> Explore ideas
        </Link>
        <div className="section-heading">
          <div>
            <span className="eyebrow">{tree.tags.join(" / ")}</span>
            <h1>{tree.title}</h1>
            <p>{tree.description}</p>
          </div>
          <Button onClick={() => setComposer(selected?.id || nodes[0]?.id)}>
            <Plus size={16} />
            Contribute
          </Button>
        </div>
        <div className="tree-subline">
          <span className="avatar tiny-avatar">MC</span>
          <span>
            {people.find((p) => p.id === tree.creator_id)?.display_name ||
              "Community contributor"}
          </span>
          <span>·</span>
          <span>{nodes.length} contributions</span>
          <span>·</span>
          <span className="accent">
            {configured ? "Live workspace" : "Demo · saved in this browser"}
          </span>
        </div>
      </div>
      {demo && (
        <p className="demo-banner">
          Judge sandbox · fictional contributors and illustrative concepts ·
          browser-only changes.{" "}
          <button
            onClick={() => {
              store.resetDemo();
              setFocus(null);
              setPicked([]);
              setRevisions([]);
              setDemoEpoch((v) => v + 1);
            }}
          >
            Reset sample only
          </button>
        </p>
      )}
      <div className="canvas-toolbar">
        <div className="search compact">
          <Search size={16} />
          <input
            aria-label="Search contributions"
            placeholder="Find a contribution…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter contribution type"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {[
            "all",
            "root",
            "extension",
            "improvement",
            "question",
            "constraint",
            "synthesis",
          ].map((k) => (
            <option value={k} key={k}>
              {k === "all" ? "All contributions" : k}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter contributor"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        >
          <option value="all">All contributors</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          onClick={() => {
            setQuery("");
            setKind("all");
            setAuthor("all");
            setCollapsed([]);
            setPicked([]);
            setLineageMode("all");
            void flow?.fitView({ padding: 0.2 });
          }}
        >
          Reset
        </Button>
        <select
          aria-label="Explore lineage"
          value={lineageMode}
          onChange={(e) => setLineageMode(e.target.value)}
        >
          <option value="all">Full graph</option>
          <option value="ancestors">Selected + ancestors</option>
          <option value="descendants">Selected + descendants</option>
        </select>
        <Button
          variant="ghost"
          onClick={() => void flow?.fitView({ padding: 0.2 })}
        >
          Fit graph
        </Button>
        <Button
          variant="outline"
          disabled={picked.length !== 2}
          onClick={() => {
            setSynthesis(true);
            setResult(null);
            setError("");
          }}
        >
          <Sparkles size={15} />
          Synthesize {picked.length}/2
        </Button>
      </div>
      <div className="canvas-layout">
        <div className="flow-canvas">
          <ReactFlow
            onInit={setFlow}
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.15}
            maxZoom={1.5}
            colorMode="dark"
            onNodeClick={(_, n) => {
              setFocus(n.id);
              setPicked((p) =>
                p.includes(n.id)
                  ? p.filter((x) => x !== n.id)
                  : [...p.slice(-1), n.id],
              );
            }}
            onNodeDoubleClick={(_, n) => setComposer(n.id)}
            nodesDraggable={false}
          >
            <Background color="#3a4944" gap={22} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(n) =>
                n.data.idea && (n.data.idea as Idea).node_type === "synthesis"
                  ? "#d6bb7c"
                  : "#65ba9c"
              }
              maskColor="rgba(12,18,16,.75)"
            />
          </ReactFlow>
          <div className="canvas-hint">
            <span className="live-dot" /> Click to inspect · Select two nodes to
            synthesize · Double-click to branch
          </div>
        </div>
        {selected && (
          <aside className="detail-drawer">
            <div className="drawer-top">
              <span className="eyebrow">CONTRIBUTION DETAILS</span>
              <button aria-label="Close details" onClick={() => setFocus(null)}>
                <X size={19} />
              </button>
            </div>
            <span className={"type-badge " + selected.node_type}>
              {selected.node_type}
            </span>
            <h2>{selected.title}</h2>
            <Link
              className="author-line"
              href={
                "/profile/" +
                (people.find((p) => p.id === selected.author_id)?.username ||
                  "you")
              }
            >
              <span className="avatar">
                {people
                  .find((p) => p.id === selected.author_id)
                  ?.display_name.split(" ")
                  .map((x) => x[0])
                  .join("") || "YO"}
              </span>
              <span>
                {people.find((p) => p.id === selected.author_id)
                  ?.display_name || "Contributor"}
                <small>
                  {new Date(selected.created_at).toLocaleDateString("en", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </small>
              </span>
            </Link>
            <p className="detail-content">{selected.content}</p>
            {Boolean(selected.metadata.blueprint) && (
              <div className="blueprint">
                {Object.entries(
                  selected.metadata.blueprint as Record<string, unknown>,
                )
                  .filter(([k]) => k !== "title" && k !== "concept")
                  .map(([k, v]) => (
                    <section key={k}>
                      <h4>{k.replaceAll("_", " ")}</h4>
                      <p>{Array.isArray(v) ? v.join(" · ") : String(v)}</p>
                    </section>
                  ))}
              </div>
            )}
            {Array.isArray(selected.metadata.links) &&
              (selected.metadata.links as string[])
                .filter((x) => /^https?:\/\//.test(x))
                .map((x) => (
                  <a
                    className="text-link"
                    key={x}
                    href={x}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source link <ExternalLink size={13} />
                  </a>
                ))}
            <div className="reactions">
              {["insightful", "buildable", "needs_work", "spark"].map((t) => (
                <button
                  className={reaction === t ? "chip selected" : "chip"}
                  key={t}
                  onClick={() => react(t)}
                >
                  <ThumbsUp size={12} />
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
            <Button className="full" onClick={() => setComposer(selected.id)}>
              <Plus size={15} />
              Build on this idea
            </Button>
            {(user === selected.author_id || user === tree.creator_id) && (
              <div className="owner-actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(selected);
                    setComposer(selected.parent_id || selected.id);
                  }}
                >
                  Edit contribution
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await store.updateNode(selected.id, {
                        status: "archived",
                      });
                      setFocus(null);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <EyeOff size={14} />
                  Archive
                </Button>
              </div>
            )}
            <div className="rail-divider" />
            <h3>
              <History size={16} /> Contribution history
            </h3>
            <div className="timeline">
              <p>
                <span />
                Created by{" "}
                {people.find((p) => p.id === selected.author_id)
                  ?.display_name || "Contributor"}
                <small>{new Date(selected.created_at).toLocaleString()}</small>
              </p>
              {selected.parent_id && (
                <button onClick={() => setFocus(selected.parent_id)}>
                  <GitBranch size={14} />
                  Builds on{" "}
                  {nodes.find((n) => n.id === selected.parent_id)?.title}
                  <ChevronRight size={14} />
                </button>
              )}
              {revisions.map((r) => (
                <div className="revision-event" key={r.id}>
                  <span />
                  Previous version: {r.title}
                  <details>
                    <summary>Read the previous contribution</summary>
                    {r.content}
                  </details>
                  <small>{new Date(r.created_at).toLocaleString()}</small>
                </div>
              ))}
              <p>
                <span />
                {selected.contribution_score} community signals
              </p>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </aside>
        )}
      </div>
      {error && !selected && !synthesis && !composer && (
        <p role="alert" className="error floating-error">
          {error}
        </p>
      )}
      {composer && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-title"
          >
            <div className="drawer-top">
              <span className="eyebrow">YOUR PERSPECTIVE MATTERS</span>
              <button
                aria-label="Close composer"
                onClick={() => {
                  setComposer(null);
                  setEditing(null);
                  setError("");
                }}
              >
                <X size={20} />
              </button>
            </div>
            <h2 id="compose-title">
              {editing
                ? "Refine your contribution."
                : "Where could this idea go?"}
            </h2>
            <p>Building on: {nodes.find((n) => n.id === composer)?.title}</p>
            <form onSubmit={save}>
              {editing && (
                <label>
                  Why this revision?
                  <input
                    name="change_reason"
                    maxLength={1000}
                    required
                    placeholder="Explain the change and its sources"
                  />
                </label>
              )}
              <label>
                Contribution title
                <input
                  name="title"
                  required
                  minLength={5}
                  maxLength={140}
                  defaultValue={editing?.title}
                  placeholder="Give your contribution a clear name"
                  autoFocus
                />
              </label>
              <label>
                Relationship
                <select name="relation">
                  <option value="extends">Extends — take it further</option>
                  <option value="improves">Improves — make it better</option>
                  <option value="challenges">
                    Challenges — ask a useful question
                  </option>
                  <option value="depends_on">
                    Depends on — surface a constraint
                  </option>
                </select>
              </label>
              <label>
                Your contribution
                <textarea
                  name="content"
                  required
                  minLength={20}
                  maxLength={10000}
                  rows={5}
                  defaultValue={editing?.content}
                  placeholder="Share the mechanism, evidence, or question. Leave a useful starting point for the next person."
                />
              </label>
              <div className="form-row">
                <label>
                  Tags
                  <input name="tags" placeholder="sensors, energy" />
                </label>
                <label>
                  Source link (optional)
                  <input name="link" type="url" placeholder="https://" />
                </label>
              </div>
              {!user && (
                <p>
                  <Link href="/login">Sign in</Link> to add your contribution.
                </p>
              )}
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <Button disabled={busy || !user} type="submit">
                {busy
                  ? "Saving your contribution…"
                  : editing
                    ? "Save revision"
                    : "Add to the tree"}
                <ArrowLeft size={15} style={{ transform: "rotate(180deg)" }} />
              </Button>
            </form>
          </section>
        </div>
      )}
      {synthesis && (
        <div className="modal-backdrop">
          <section
            className="modal synthesis-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="synthesis-title"
          >
            <div className="drawer-top">
              <span className="eyebrow">
                <Sparkles size={14} /> THE SYNERGY ENGINE
              </span>
              <button
                aria-label="Close synthesis"
                onClick={() => !busy && setSynthesis(false)}
              >
                <X size={20} />
              </button>
            </div>
            <h2 id="synthesis-title">Two branches. A new possibility.</h2>
            <p>
              Find the complementary strengths, and turn them into a buildable
              concept.
            </p>
            <div className="synthesis-sources">
              {picked.map((id) => (
                <div key={id}>
                  <GitBranch size={15} />
                  {nodes.find((n) => n.id === id)?.title}
                </div>
              ))}
            </div>
            {!result && (
              <label>
                What would you like to explore?
                <textarea
                  rows={3}
                  value={intent}
                  maxLength={2000}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="For example: combine these ideas for an off-grid pilot with a $50 budget."
                />
              </label>
            )}
            {busy && (
              <div className="generation" role="status">
                <div className="generation-line" />
                {
                  [
                    "Reading both contributions",
                    "Finding strengths and tensions",
                    "Drafting the invention blueprint",
                    "Connecting the new branch",
                  ][stage]
                }
                <div className="skeleton" />
                <div className="skeleton short" />
              </div>
            )}
            {result && (
              <div className="blueprint">
                {Object.entries(result).map(([k, v]) => (
                  <section key={k}>
                    <h4>{k.replaceAll("_", " ")}</h4>
                    <p>{Array.isArray(v) ? v.join(" · ") : String(v)}</p>
                  </section>
                ))}
              </div>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button
              disabled={busy}
              onClick={result ? () => setSynthesis(false) : generate}
            >
              <Sparkles size={16} />
              {result
                ? "Explore the new branch"
                : busy
                  ? "Bringing ideas together…"
                  : "Generate a blueprint"}
            </Button>
            <small className="muted">
              AI proposes a starting point. The community makes it better.
            </small>
          </section>
        </div>
      )}
      <InnovationPanel
        key={demoEpoch}
        demo={demo}
        onConnections={setConnections}
        onPickPair={setPicked}
        tree={tree}
        nodes={nodes}
        people={people}
        selected={selected}
        picked={picked}
        user={user}
        revisions={revisions}
        onOpen={setFocus}
        onRestore={async (v) => {
          if (selected)
            await store.updateNode(selected.id, {
              title: v.title,
              content: v.content,
              change_reason: "Restored earlier snapshot " + v.id,
            });
        }}
      />
    </div>
  );
}
