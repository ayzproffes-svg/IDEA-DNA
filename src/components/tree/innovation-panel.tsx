"use client";
import { useCallback, useEffect, useState } from "react";
import type { Idea, Person, Tree } from "@/types";
import { configured as liveConfigured } from "@/lib/supabase/client";
import { compareText, sources } from "@/lib/evolution";
import { seedJudgeSandbox } from "@/lib/judge-demo";
import { Button } from "@/components/ui/button";
type Entry = {
  id: string;
  node_id: string;
  target_id: string | null;
  author_id: string;
  kind: string;
  body: string;
  relation: string | null;
  source_url: string | null;
  origin: string;
  status: string;
  created_at: string;
  reviewed_by?: string;
};
type Version = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  editor_id?: string;
  reason?: string;
};
export function InnovationPanel({
  demo = false,
  onConnections,
  onPickPair,
  tree,
  nodes,
  people,
  selected,
  picked,
  user,
  revisions,
  onOpen,
  onRestore,
}: {
  demo?: boolean;
  onConnections: (entries: Entry[]) => void;
  onPickPair: (ids: string[]) => void;
  tree: Tree;
  nodes: Idea[];
  people: Person[];
  selected?: Idea;
  picked: string[];
  user: string | null;
  revisions: Version[];
  onOpen: (id: string) => void;
  onRestore: (v: Version) => Promise<void>;
}) {
  const configured = liveConfigured && !demo;
  const storageKey =
    (demo ? "ideadna-judge-innovation-" : "ideadna-innovation-") + tree.id;
  const [tab, setTab] = useState("overview"),
    [entries, setEntries] = useState<Entry[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all"),
    [tour, setTour] = useState(-1);
  useEffect(() => {
    onConnections(entries);
  }, [entries, onConnections]);
  const [before, setBefore] = useState(""),
    [after, setAfter] = useState("current");
  const [audit, setAudit] = useState<
    {
      entry_id: string;
      created_at: string;
      after_body: Record<string, unknown>;
    }[]
  >([]);
  const [review, setReview] = useState<Entry | null>(null);
  const load = useCallback(async () => {
    setError("");
    try {
      if (!configured) {
        if (demo) seedJudgeSandbox();
        setEntries(JSON.parse(localStorage.getItem(storageKey) || "[]"));
        return;
      }
      const r = await fetch("/api/innovation?tree_id=" + tree.id, {
        signal: AbortSignal.timeout(15000),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setEntries(d);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tree.id, configured, storageKey]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    setBefore("");
    setAfter("current");
  }, [selected?.id]);
  async function send(path: string, method: string, body: unknown) {
    const r = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    return d;
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    if (!selected) return;
    await run(async () => {
      const body = {
        tree_id: tree.id,
        node_id: selected.id,
        target_id: String(f.get("target") || "") || null,
        kind: String(f.get("kind")),
        body: String(f.get("body")),
        relation: String(f.get("relation") || "") || null,
        source_url: String(f.get("url") || "") || null,
      };
      if (configured) {
        await send("/api/innovation", "POST", body);
        await load();
      } else {
        const next = [
          {
            ...body,
            id: crypto.randomUUID(),
            author_id: user || "demo",
            origin: "human",
            status: "proposed",
            created_at: new Date().toISOString(),
          },
          ...entries,
        ];
        localStorage.setItem(storageKey, JSON.stringify(next));
        setEntries(next);
      }
      form.reset();
    });
  }
  async function decide(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!review) return;
    const f = new FormData(e.currentTarget);
    await run(async () => {
      const patch = {
        id: review.id,
        body: String(f.get("body")),
        relation: String(f.get("relation") || "") || null,
        status: String(f.get("status")),
      };
      if (configured) {
        await send("/api/innovation", "PATCH", patch);
        await load();
      } else {
        const next = entries.map((x) =>
          x.id === review.id
            ? { ...x, ...patch, reviewed_by: user || "demo" }
            : x,
        );
        localStorage.setItem(storageKey, JSON.stringify(next));
        setEntries(next);
      }
      setReview(null);
    });
  }
  const versions: Version[] = selected
    ? [
        {
          id: "current",
          title: selected.title,
          content: selected.content,
          created_at: "Current state",
        },
        ...revisions,
      ]
    : [];
  const a = versions.find((v) => v.id === before),
    b = versions.find((v) => v.id === after);
  const diff =
    a && b
      ? compareText(a.title + "\n" + a.content, b.title + "\n" + b.content)
      : null;
  const owner = user === tree.creator_id;
  const relations = [
    "improves",
    "depends_on",
    "combines_with",
    "inspired_by",
    "supports",
    "challenges",
    "conflicts_with",
  ];
  const tourSteps = [
    {
      title: "1 · Original idea (30 seconds)",
      text: "Select the root. Inspect the problem and original contributor.",
      node: nodes.find((n) => n.node_type === "root"),
    },
    {
      title: "2 · Explore alternatives (30 seconds)",
      text: "Inspect an extension and an improvement. Use ancestors and descendants to follow each branch.",
      node: nodes.find((n) => n.node_type === "extension"),
    },
    {
      title: "3 · Surface uncertainty (30 seconds)",
      text: "Inspect a question or constraint. In Evidence, record an assumption or risk; a reference is not automatic proof.",
      node: nodes.find(
        (n) => n.node_type === "constraint" || n.node_type === "question",
      ),
    },
    {
      title: "4 · Review a connection (30 seconds)",
      text: "Select two contributions and explain their connection. The project owner can edit, accept or reject the proposal.",
      node: nodes.find((n) => n.node_type === "improvement"),
    },
    {
      title: "5 · Compare versions (30 seconds)",
      text: "Open Versions for a contribution with saved edits. Compare snapshots or restore a previous state as a new revision.",
      node: nodes.find((n) => n.id === selected?.id),
    },
    {
      title: "6 · Trace the combined idea (30 seconds)",
      text: "Inspect a synthesis and follow each source. The blueprint is preliminary; no validation or ownership is implied.",
      node: nodes.find((n) => n.node_type === "synthesis"),
    },
  ];
  function step(i: number) {
    setTour(i);
    const n = tourSteps[i]?.node;
    if (n) onOpen(n.id);
  }
  return (
    <section className="innovation-panel" aria-label="Innovation workbench">
      <div className="section-heading">
        <div>
          <span className="eyebrow">IDEA EVOLUTION WORKBENCH</span>
          <h2>Explore, question, improve.</h2>
        </div>
        <Button variant="outline" onClick={() => step(0)}>
          3-minute walkthrough
        </Button>
      </div>
      {tour >= 0 && (
        <div className="tour-card" role="status">
          <strong>{tourSteps[tour].title}</strong>
          <p>{tourSteps[tour].text}</p>
          <Button
            variant="ghost"
            disabled={tour === 0}
            onClick={() => step(tour - 1)}
          >
            Previous
          </Button>
          <Button onClick={() => (tour < 5 ? step(tour + 1) : setTour(-1))}>
            {tour < 5 ? "Next" : "Finish"}
          </Button>
          <button onClick={() => setTour(-1)} aria-label="Close walkthrough">
            Close
          </button>
          <small>
            Guided steps; analysis needs sign-in. Sample data is illustrative,
            not validated research.
          </small>
        </div>
      )}
      <nav className="innovation-tabs" aria-label="Workbench sections">
        {[
          "overview",
          "versions",
          "evidence",
          "connections",
          "readiness",
          "activity",
        ].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      {error && (
        <p className="error" role="alert">
          {error} <button onClick={() => void load()}>Retry records</button>
        </p>
      )}
      {tab === "overview" && (
        <div>
          <p>
            Select a contribution to inspect its lineage, evidence and versions.
            Text matches only; semantic search is not enabled.
          </p>
          <div
            className="accessible-nodes"
            aria-label="Accessible contribution navigation"
          >
            {nodes.map((n) => (
              <button
                key={n.id}
                aria-pressed={selected?.id === n.id}
                onClick={() => onOpen(n.id)}
              >
                <strong>{n.title}</strong>
                <small>
                  {n.node_type} ·{" "}
                  {people.find((p) => p.id === n.author_id)?.display_name ||
                    "Contributor"}
                </small>
              </button>
            ))}
          </div>
          {selected && (
            <>
              <h3>Sources of {selected.title}</h3>
              {sources(selected).map((id) => (
                <button className="chip" key={id} onClick={() => onOpen(id)}>
                  {nodes.find((n) => n.id === id)?.title ||
                    "Source unavailable"}
                </button>
              ))}
              <p>Links record contribution provenance, not legal ownership.</p>
              <Button
                disabled={busy || !user || !configured}
                onClick={() =>
                  void run(async () => {
                    await send("/api/innovation/analyze", "POST", {
                      tree_id: tree.id,
                      node_ids: [selected.id],
                    });
                    await load();
                    setTab("connections");
                  })
                }
              >
                Run innovation analyst
              </Button>
              <p>
                AI assessments are preliminary. Selected idea text is sent to
                the configured provider only when you run analysis.
              </p>
            </>
          )}
        </div>
      )}
      {tab === "versions" && (
        <div>
          {!selected ? (
            <p>Select a contribution first.</p>
          ) : (
            <>
              <h3>{selected.title}</h3>
              <p>
                Snapshots preserve earlier text. Comparison highlights the
                changed span; unchanged words inside that span may also be
                highlighted.
              </p>
              <div className="compare-controls">
                <label>
                  Earlier version
                  <select
                    value={before}
                    onChange={(e) => setBefore(e.target.value)}
                  >
                    <option value="">Choose snapshot</option>
                    {versions.map((v, i) => (
                      <option key={v.id} value={v.id}>
                        {i === 0
                          ? "Current"
                          : new Date(v.created_at).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Later version
                  <select
                    value={after}
                    onChange={(e) => setAfter(e.target.value)}
                  >
                    {versions.map((v, i) => (
                      <option key={v.id} value={v.id}>
                        {i === 0
                          ? "Current"
                          : new Date(v.created_at).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {revisions.length === 0 && (
                <p>
                  No earlier revisions yet. Editing this contribution will
                  preserve its previous state.
                </p>
              )}
              {diff && (
                <>
                  <p className="text-diff">
                    {diff.unchanged} <del>{diff.removed}</del>{" "}
                    <ins>{diff.added}</ins> {diff.suffix}
                  </p>
                  <div className="version-columns">
                    <article>
                      <h4>Earlier text</h4>
                      <h3>{a?.title}</h3>
                      <p>{a?.content}</p>
                    </article>
                    <article>
                      <h4>Later text</h4>
                      <h3>{b?.title}</h3>
                      <p>{b?.content}</p>
                    </article>
                  </div>
                </>
              )}
              {a &&
                a.id !== "current" &&
                (owner || user === selected.author_id) && (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await onRestore(a);
                        setBefore("");
                      })
                    }
                  >
                    Restore earlier text as a new revision
                  </Button>
                )}
              <p>
                {a?.reason ||
                  "Revision reasons were not recorded for legacy snapshots."}{" "}
                See linked branches for contribution context.
              </p>
            </>
          )}
        </div>
      )}
      {(tab === "evidence" || tab === "connections") && (
        <div>
          {tab === "connections" && (
            <>
              <p>
                AI proposals remain unreviewed until the project owner accepts
                them. Accepted links preserve both original branches.
              </p>
              <Button
                disabled={busy || picked.length !== 2 || !user || !configured}
                onClick={() =>
                  void run(async () => {
                    await send("/api/innovation/analyze", "POST", {
                      tree_id: tree.id,
                      node_ids: picked,
                    });
                    await load();
                  })
                }
              >
                Explain connection · {picked.length}/2 selected
              </Button>
            </>
          )}
          {tab === "connections" && selected && (
            <div>
              <h3>Related candidates · keyword matches</h3>
              <p>
                Shared words suggest candidates; this is not semantic search or
                AI analysis.
              </p>
              {nodes
                .filter((n) => n.id !== selected.id)
                .map((n) => ({
                  node: n,
                  words: [
                    ...new Set(
                      (selected.title + " " + selected.content)
                        .toLowerCase()
                        .match(/[a-z]{5,}/g) || [],
                    ),
                  ].filter((w) =>
                    (n.title + " " + n.content).toLowerCase().includes(w),
                  ),
                }))
                .filter((x) => x.words.length > 0)
                .sort((a, b) => b.words.length - a.words.length)
                .slice(0, 3)
                .map((x) => (
                  <p key={x.node.id}>
                    <button
                      className="chip"
                      onClick={() => onPickPair([selected.id, x.node.id])}
                    >
                      Select pair: {x.node.title}
                    </button>{" "}
                    Shared: {x.words.slice(0, 4).join(", ")}
                  </p>
                ))}
            </div>
          )}
          {selected && (
            <form className="innovation-form" onSubmit={add}>
              <h3>Add to {selected.title}</h3>
              <label>
                Record type
                <select
                  name="kind"
                  defaultValue={
                    tab === "connections" ? "relationship" : "assumption"
                  }
                >
                  {[
                    "evidence",
                    "assumption",
                    "risk",
                    "question",
                    "relationship",
                    "contribution",
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label>
                Claim, explanation or open question
                <textarea
                  name="body"
                  required
                  minLength={5}
                  maxLength={12000}
                />
              </label>
              <label>
                Reference URL (optional)
                <input name="url" type="url" placeholder="https://…" />
              </label>
              <label>
                Related contribution (required for a relationship)
                <select name="target">
                  <option value="">None</option>
                  {nodes
                    .filter((n) => n.id !== selected.id)
                    .map((n) => (
                      <option value={n.id} key={n.id}>
                        {n.title}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Relationship type
                <select name="relation">
                  {relations.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <Button disabled={busy || !user}>Save proposal</Button>
              <small>
                References are user supplied. Acceptance means reviewed, not
                scientifically proven.
              </small>
            </form>
          )}
          {entries
            .filter((e) =>
              tab === "connections"
                ? ["relationship", "analysis"].includes(e.kind)
                : !["relationship", "analysis"].includes(e.kind),
            )
            .map((e) => (
              <article className="innovation-entry" key={e.id}>
                <span className="eyebrow">
                  {e.kind} ·{" "}
                  {e.origin === "ai"
                    ? demo
                      ? "Prewritten demonstration · not live AI"
                      : "AI generated · preliminary"
                    : "Human proposed"}{" "}
                  · {e.status}
                </span>
                <h4>
                  <button onClick={() => onOpen(e.node_id)}>
                    {nodes.find((n) => n.id === e.node_id)?.title ||
                      "Contribution"}
                  </button>
                  {e.target_id && (
                    <>
                      {" "}
                      →{" "}
                      <button onClick={() => onOpen(e.target_id!)}>
                        {nodes.find((n) => n.id === e.target_id)?.title ||
                          "Source"}
                      </button>
                    </>
                  )}
                </h4>
                {e.relation && <p>{e.relation.replaceAll("_", " ")}</p>}
                {e.origin === "ai" ? <Report body={e.body} /> : <p>{e.body}</p>}
                {e.source_url && /^https?:\/\//.test(e.source_url) && (
                  <a href={e.source_url} target="_blank" rel="noreferrer">
                    Open reference
                  </a>
                )}
                <small>
                  Proposed by{" "}
                  {people.find((p) => p.id === e.author_id)?.display_name ||
                    "Contributor"}{" "}
                  · {new Date(e.created_at).toLocaleString()}
                  {e.reviewed_by ? " · Reviewed by project owner" : ""}
                </small>
                <Button
                  variant="ghost"
                  disabled={!configured}
                  onClick={() =>
                    void run(async () => {
                      const r = await fetch("/api/innovation?entry_id=" + e.id);
                      const d = await r.json();
                      if (!r.ok) throw Error(d.error);
                      setAudit(d);
                    })
                  }
                >
                  Review history
                </Button>
                {audit
                  .filter((v) => v.entry_id === e.id)
                  .map((v, i) => (
                    <p key={v.created_at + i}>
                      Recorded {new Date(v.created_at).toLocaleString()} ·{" "}
                      {String(v.after_body.status)} ·{" "}
                      {String(v.after_body.body)}
                    </p>
                  ))}
                {owner && (
                  <Button variant="ghost" onClick={() => setReview(e)}>
                    Edit / review
                  </Button>
                )}
              </article>
            ))}
          {!entries.some((e) =>
            tab === "connections"
              ? ["relationship", "analysis"].includes(e.kind)
              : !["relationship", "analysis"].includes(e.kind),
          ) && <p>No records yet. Add a proposal to begin.</p>}
          {review && (
            <form className="innovation-form" onSubmit={decide}>
              <h3>Review proposal</h3>
              <label>
                Explanation
                <textarea
                  name="body"
                  required
                  minLength={5}
                  maxLength={12000}
                  defaultValue={review.body}
                />
              </label>
              <label>
                Type
                <select name="relation" defaultValue={review.relation || ""}>
                  <option value="">Not a relationship</option>
                  {relations.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                Decision
                <select name="status">
                  <option>accepted</option>
                  <option>rejected</option>
                  <option>resolved</option>
                </select>
              </label>
              <Button disabled={busy}>Save decision</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReview(null)}
              >
                Cancel
              </Button>
            </form>
          )}
        </div>
      )}
      {tab === "readiness" && (
        <div>
          <h3>Transparent readiness checklist</h3>
          <p>
            These checks report stored signals, not a viability score. A human
            must assess quality and validation.
          </p>
          {[
            {
              label: "Problem clarity",
              signal: nodes.some((n) => n.node_type === "root"),
              next: "Write a specific problem, audience and observable success criterion.",
            },
            {
              label: "Feasibility questions",
              signal: entries.some((e) => e.kind === "question"),
              next: "Record technical dependencies and test the largest uncertainty.",
            },
            {
              label: "Evidence quality",
              signal: entries.some(
                (e) =>
                  e.kind === "evidence" &&
                  e.source_url &&
                  e.status === "accepted",
              ),
              next: "Attach a relevant reference and have the project owner review the claim.",
            },
            {
              label: "Risks",
              signal: entries.some((e) => e.kind === "risk"),
              next: "Record a risk and a concrete mitigation experiment.",
            },
            {
              label: "Validation planning",
              signal: entries.some(
                (e) => e.kind === "question" && e.status === "resolved",
              ),
              next: "Resolve an investigation question with a documented method and outcome.",
            },
          ].map((c) => (
            <article className="innovation-entry" key={c.label}>
              <h4>
                {c.label} · {c.signal ? "Recorded signal" : "Needs attention"}
              </h4>
              <p>{c.next}</p>
            </article>
          ))}
          <p>
            No claim of scientific validation, commercial success or
            patentability is made.
          </p>
        </div>
      )}
      {tab === "activity" && (
        <div>
          <label>
            Activity filter
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All activity</option>
              <option value="branches">Branches</option>
              <option value="pending">Pending reviews</option>
              <option value="assumptions">Unresolved assumptions</option>
            </select>
          </label>
          <p>
            {nodes.length} contributions ·{" "}
            {
              entries.filter(
                (e) => e.kind === "relationship" && e.status === "proposed",
              ).length
            }{" "}
            pending connections ·{" "}
            {
              entries.filter(
                (e) =>
                  e.kind === "assumption" &&
                  e.status !== "resolved" &&
                  e.status !== "rejected",
              ).length
            }{" "}
            unresolved assumptions
          </p>
          {filter !== "branches" &&
            entries
              .filter(
                (e) =>
                  filter === "all" ||
                  (filter === "pending" && e.status === "proposed") ||
                  (filter === "assumptions" &&
                    e.kind === "assumption" &&
                    !["resolved", "rejected"].includes(e.status)),
              )
              .map((e) => (
                <p key={e.id}>
                  {e.kind} · {e.status} ·{" "}
                  {new Date(e.created_at).toLocaleString()}{" "}
                  <button
                    onClick={() => {
                      onOpen(e.node_id);
                      setTab(
                        e.kind === "relationship" ? "connections" : "evidence",
                      );
                    }}
                  >
                    Inspect
                  </button>
                </p>
              ))}
          {(filter === "all" || filter === "branches") &&
            [...nodes]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .slice(0, 20)
              .map((n) => (
                <p key={n.id}>
                  <button onClick={() => onOpen(n.id)}>{n.title}</button> ·{" "}
                  {n.node_type} · {new Date(n.created_at).toLocaleString()}
                </p>
              ))}
          <p>
            Version changes are available in the selected contribution’s
            history.
          </p>
        </div>
      )}
    </section>
  );
}
function Report({ body }: { body: string }) {
  try {
    const d = JSON.parse(body) as Record<string, unknown>;
    return (
      <div>
        {Object.entries(d)
          .filter(([k]) => k !== "relation")
          .map(([k, v]) => (
            <div key={k}>
              <strong>{k}</strong>
              <p>{Array.isArray(v) ? v.join(" · ") : String(v)}</p>
            </div>
          ))}
      </div>
    );
  } catch {
    return <p>{body}</p>;
  }
}
