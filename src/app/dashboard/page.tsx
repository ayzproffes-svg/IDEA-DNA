"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  GitBranch,
  Network,
  Users,
  Sparkles,
} from "lucide-react";
import { useIdeas } from "@/hooks/use-ideas";
import { Button } from "@/components/ui/button";
export default function Dashboard() {
  const { trees: allTrees, nodes: allNodes, people, ready, error } = useIdeas();
  const trees = allTrees.filter((t) => t.visibility === "public");
  const nodes = allNodes.filter((n) => trees.some((t) => t.id === n.tree_id));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en", { weekday: "short" }),
    };
  });
  const counts = days.map(
    (d) => nodes.filter((n) => n.created_at.slice(0, 10) === d.date).length,
  );
  const max = Math.max(1, ...counts);
  return (
    <div className="page">
      <span className="eyebrow">PROGRESS, IN PERSPECTIVE</span>
      <div className="page-title">
        <div>
          <h1>Small steps. Shared momentum.</h1>
          <p>A transparent look at how the public network is growing.</p>
        </div>
        <Button asChild>
          <Link href="/explore">
            Find a tree to grow <ArrowUpRight size={15} />
          </Link>
        </Button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="analytics-stats">
        {[
          [Network, trees.length, "living trees"],
          [GitBranch, nodes.length, "contributions"],
          [Users, new Set(nodes.map((n) => n.author_id)).size, "contributors"],
          [
            Sparkles,
            nodes.filter((n) => n.node_type === "synthesis").length,
            "new syntheses",
          ],
        ].map(([Icon, count, label]) => {
          const I = Icon as typeof Network;
          return (
            <article key={label as string}>
              <I size={18} />
              <strong>{count as number}</strong>
              <span>{label as string}</span>
            </article>
          );
        })}
      </div>
      <div className="analytics-columns">
        <section className="analytics-panel">
          <h2>A week of building</h2>
          <p>Published contributions by day</p>
          <div
            className="bar-chart"
            role="img"
            aria-label={days
              .map((d, i) => d.label + ": " + counts[i] + " contributions")
              .join(", ")}
          >
            {days.map((d, i) => (
              <div key={d.date}>
                <span>{counts[i]}</span>
                <div
                  style={{
                    height: `${Math.max(3, (counts[i] / max) * 150)}px`,
                  }}
                />
                <small>{d.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="analytics-panel">
          <h2>How ideas evolve</h2>
          <p>Every kind of perspective has a place.</p>
          {[
            "root",
            "extension",
            "improvement",
            "question",
            "constraint",
            "synthesis",
          ].map((kind) => (
            <div className="type-stat" key={kind}>
              <span>{kind}</span>
              <div>
                <i
                  style={{
                    width: `${nodes.length ? (nodes.filter((n) => n.node_type === kind).length / nodes.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <strong>
                {nodes.filter((n) => n.node_type === kind).length}
              </strong>
            </div>
          ))}
        </section>
      </div>
      <section style={{ marginTop: 35 }}>
        <h2 style={{ fontSize: 21 }}>Where the energy is</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Idea tree</th>
                <th>Contributions</th>
                <th>Contributors</th>
                <th>Community signals</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {trees.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={"/trees/" + t.slug}>{t.title}</Link>
                  </td>
                  <td>{nodes.filter((n) => n.tree_id === t.id).length}</td>
                  <td>
                    {
                      new Set(
                        nodes
                          .filter((n) => n.tree_id === t.id)
                          .map((n) => n.author_id),
                      ).size
                    }
                  </td>
                  <td>
                    {nodes
                      .filter((n) => n.tree_id === t.id)
                      .reduce((s, n) => s + n.contribution_score, 0)}
                  </td>
                  <td>
                    <Link
                      aria-label={"Open " + t.title}
                      href={"/trees/" + t.slug}
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ready && !nodes.length && (
          <div className="empty">
            <h3>The first step is yours.</h3>
            <p>Plant an idea to begin the contribution trail.</p>
          </div>
        )}
      </section>
      <p className="demo-label">
        {people.length} public profiles · Figures reflect currently readable
        published contributions.
      </p>
    </div>
  );
}
