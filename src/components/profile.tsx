"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, ArrowUpRight, Network } from "lucide-react";
import { useIdeas } from "@/hooks/use-ideas";
import { people } from "@/lib/demo";
import { browserDB, configured } from "@/lib/supabase/client";
import { MiniTree } from "@/components/discover";
import type { Person } from "@/types";
export function Profile({ username }: { username: string }) {
  const store = useIdeas();
  const [person, setPerson] = useState<Person | undefined>(
    people.find((p) => p.username === username),
  );
  const [loaded, setLoaded] = useState(!configured);
  useEffect(() => {
    if (configured)
      void browserDB()
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle()
        .then(({ data }) => {
          setPerson(data || undefined);
          setLoaded(true);
        });
    else {
      try {
        const p = JSON.parse(localStorage.getItem("ideadna-profile") || "null");
        if (p?.username === username) setPerson(p);
      } catch {}
    }
  }, [username]);
  if (!person)
    return (
      <div className="page empty">
        <h1>
          {loaded ? "Contributor not found" : "Finding this contributor…"}
        </h1>
        <Link href="/explore">Explore the network</Link>
      </div>
    );
  const contributions = store.nodes.filter((n) => n.author_id === person.id);
  const activeTrees = store.trees.filter((t) =>
    contributions.some((n) => n.tree_id === t.id),
  );
  return (
    <div className="page">
      <div className="profile-banner" />
      <div className="profile-header">
        {person.avatar_url ? (
          <img src={person.avatar_url} alt="" className="avatar" />
        ) : (
          <span className="avatar">
            {person.display_name
              .split(" ")
              .map((x) => x[0])
              .join("")}
          </span>
        )}
        <div>
          <h1>{person.display_name}</h1>
          <small className="accent">@{person.username}</small>
          <p style={{ marginTop: 15 }}>{person.bio}</p>
        </div>
        <Link href="/trees/new" className="button outline">
          Start a collaboration <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="profile-stats">
        {[
          [contributions.length, "contributions"],
          [
            store.trees.filter((t) => t.creator_id === person.id).length,
            "trees planted",
          ],
          [activeTrees.length, "trees growing"],
          [
            contributions.reduce((s, n) => s + n.contribution_score, 0),
            "community signals",
          ],
        ].map(([n, label]) => (
          <div key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="profile-columns">
        <section>
          <div className="section-heading" style={{ marginTop: 0 }}>
            <h2>Ideas made better</h2>
            <span className="eyebrow">BEST RATED</span>
          </div>
          {[...contributions]
            .sort((a, b) => b.contribution_score - a.contribution_score)
            .map((n) => (
              <Link
                className="contribution-row"
                href={
                  "/trees/" +
                  store.trees.find((t) => t.id === n.tree_id)?.slug +
                  "/node/" +
                  n.id
                }
                key={n.id}
              >
                <GitBranch size={18} />
                <div>
                  <h3>{n.title}</h3>
                  <p>
                    {n.node_type} ·{" "}
                    {store.trees.find((t) => t.id === n.tree_id)?.title}
                  </p>
                </div>
                <span>↑ {n.contribution_score}</span>
              </Link>
            ))}
          {!contributions.length && (
            <div className="empty">
              <Network size={25} />
              <h3>A fresh perspective, ready to grow.</h3>
              <p>This contributor hasn’t planted a branch yet.</p>
            </div>
          )}
          <h2 style={{ marginTop: 35, fontSize: 20 }}>
            The contribution trail
          </h2>
          <div className="timeline">
            {[...contributions].reverse().map((n) => (
              <p key={n.id}>
                <span />
                {n.node_type === "root" ? "Planted" : "Contributed"} “{n.title}”
                <small>
                  {new Date(n.created_at).toLocaleDateString("en", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </small>
              </p>
            ))}
          </div>
        </section>
        <aside>
          <h3>Part of a bigger picture</h3>
          {activeTrees.map((t, i) => (
            <Link
              className="participation-tree"
              style={{ display: "block" }}
              key={t.id}
              href={"/trees/" + t.slug}
            >
              <MiniTree variant={i + 10} />
              <h3>{t.title}</h3>
              <small className="muted">
                {contributions.filter((n) => n.tree_id === t.id).length}{" "}
                branches contributed
              </small>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
