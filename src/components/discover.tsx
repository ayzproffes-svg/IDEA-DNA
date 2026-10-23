"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  Network,
  Users,
  GitBranch,
  SlidersHorizontal,
  Sparkles,
  Droplets,
  Wrench,
  Radio,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useIdeas } from "@/hooks/use-ideas";

import { Button } from "@/components/ui/button";
import { configured } from "@/lib/supabase/client";
export function MiniTree({ variant = 0 }: { variant?: number }) {
  return (
    <svg
      className={`mini-tree variant-${variant}`}
      viewBox="0 0 380 180"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`dots${variant}`}
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".25" />
        </pattern>
      </defs>
      <rect width="380" height="180" fill={`url(#dots${variant})`} />
      <g stroke="currentColor" opacity=".4">
        <path d="M190 35V58Q190 72 140 72H85Q70 72 70 90V110M190 35V110M190 35V58Q190 72 240 72H295Q310 72 310 90V110M70 125V143Q70 150 100 150H175Q190 150 190 160M310 125V143Q310 150 280 150H205Q190 150 190 160" />
      </g>
      {[
        [190, 30],
        [70, 110],
        [190, 110],
        [310, 110],
        [190, 160],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect
            x={x - 34}
            y={y - 13}
            width="68"
            height="27"
            rx="6"
            fill="var(--panel)"
            stroke="currentColor"
            opacity={i === 0 || i === 4 ? 1 : 0.55}
          />
          <circle cx={x - 22} cy={y} r="3" fill="currentColor" />
          <path
            d={`M${x - 13} ${y - 3}h32M${x - 13} ${y + 3}h21`}
            stroke="currentColor"
            strokeWidth="2"
            opacity=".6"
          />
        </g>
      ))}
    </svg>
  );
}
export function Discover({
  landing = false,
  mine = false,
}: {
  landing?: boolean;
  mine?: boolean;
}) {
  const { trees, nodes, error, people, ready, refresh } = useIdeas(
    undefined,
    mine,
  );
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All ideas");
  const [sort, setSort] = useState("Trending");
  const [domain, setDomain] = useState("All domains");
  const [status, setStatus] = useState("Any status");
  useEffect(() => {
    function searchShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) &&
        !target.isContentEditable
      ) {
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>('[aria-label="Search ideas"]')
          ?.focus();
      }
    }
    document.addEventListener("keydown", searchShortcut);
    return () => document.removeEventListener("keydown", searchShortcut);
  }, []);
  const categories = [
    "All ideas",
    "Climate tech",
    "Community",
    "Hardware",
    "Open source",
    "Resilience",
  ];
  const shown = trees
    .filter(
      (t) =>
        (mine || t.visibility === "public") &&
        (tag === "All ideas" || t.tags.includes(tag)) &&
        (domain === "All domains" || t.tags.includes(domain)) &&
        (status !== "Synthesized" ||
          nodes.some(
            (n) => n.tree_id === t.id && n.node_type === "synthesis",
          )) &&
        [
          t.title,
          t.description,
          ...t.tags,
          ...nodes
            .filter((n) => n.tree_id === t.id)
            .map(
              (n) =>
                n.content +
                " " +
                n.title +
                " " +
                (people.find((p) => p.id === n.author_id)?.display_name || ""),
            ),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Newest"
        ? b.created_at.localeCompare(a.created_at)
        : nodes
            .filter((n) => n.tree_id === b.id)
            .reduce((s, n) => s + n.contribution_score, 0) -
          nodes
            .filter((n) => n.tree_id === a.id)
            .reduce((s, n) => s + n.contribution_score, 0),
    );
  return (
    <div className="page discover">
      <div className="eyebrow">
        <span className="live-dot" /> A PLACE FOR WHAT COMES NEXT
      </div>
      <div className="page-title">
        <div>
          <h1>
            {mine ? (
              "Your next chapter starts here."
            ) : landing ? (
              <>
                Good ideas don’t grow
                <br />
                in isolation.
              </>
            ) : (
              <>
                Small sparks.
                <br />
                <span className="serif">Extraordinary possibilities.</span>
              </>
            )}
          </h1>
          <p>
            Discover an idea. Add your perspective. Build something bigger,
            together.
          </p>
        </div>
        <Button asChild>
          <Link href="/trees/new">
            <Plus size={17} />
            Start an idea
          </Link>
        </Button>
      </div>
      <div className="discovery-layout">
        <section>
          <Link className="featured" href="/trees/water-monitoring">
            <div className="featured-copy">
              <span className="eyebrow">
                THE COMMUNITY SPOTLIGHT <span className="feature-line" />
              </span>
              <div className="featured-tag">
                <Droplets size={14} /> CLIMATE TECH
              </div>
              <h2>
                Better water.
                <br />
                Brighter futures.
              </h2>
              <p>
                A sensor. A solar panel. A community.
                <br />
                See what happens when good ideas connect.
              </p>
              <span className="text-link">
                Explore the idea tree <ArrowUpRight size={17} />
              </span>
              <div className="featured-people">
                <div className="avatar-stack">
                  {["MC", "AP", "SR"].map((x) => (
                    <span className="avatar" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
                <span>4 minds building together</span>
              </div>
            </div>
            <div className="hero-network">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <svg viewBox="0 0 420 330" aria-hidden="true">
                <g stroke="#6bbba6" strokeWidth="1" fill="none">
                  <path d="M205 85L95 170L175 250M205 85L320 165L245 250M95 170L245 250M320 165L175 250M205 85L205 210" />
                </g>
              </svg>
              <div className="float-node root-float">
                <Droplets size={20} />
                <span>
                  Clean water for everyone<small>THE ROOT IDEA</small>
                </span>
              </div>
              <div className="float-node sensor-float">
                <span className="node-symbol">⌁</span>
                <span>
                  Low-power sensors<small>EXTENSION</small>
                </span>
              </div>
              <div className="float-node solar-float">
                <span className="node-symbol">☼</span>
                <span>
                  Solar-powered<small>IMPROVEMENT</small>
                </span>
              </div>
              <div className="float-node synthesis-float">
                <Sparkles size={18} />
                <span>
                  A new possibility<small>AI SYNTHESIS</small>
                </span>
              </div>
              <span className="network-caption">
                CONNECTED IDEAS. COLLECTIVE IMPACT.
              </span>
            </div>
            <span className="feature-index">01 / 03</span>
          </Link>
          <div className="section-heading">
            <div>
              <h2>{mine ? "All idea trees" : "Find your next “what if”"}</h2>
              <p>
                Early thoughts. Bold experiments. Room for your perspective.
              </p>
            </div>
            <label className="sort-label">
              <SlidersHorizontal size={14} />
              <select
                aria-label="Sort ideas"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option>Trending</option>
                <option>Newest</option>
              </select>
            </label>
          </div>
          <div className="search">
            <Search size={18} />
            <input
              aria-label="Search ideas"
              placeholder="Search ideas, topics, or contributors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>/</kbd>
          </div>
          <div className="filter-row">
            {categories.map((x) => (
              <button
                className={tag === x ? "chip selected" : "chip"}
                onClick={() => setTag(x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="advanced-filters">
            <select
              aria-label="Filter by domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              {[
                "All domains",
                "Climate tech",
                "Community",
                "Hardware",
                "Resilience",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Any status</option>
              <option>Synthesized</option>
            </select>
            <span>{shown.length} living idea trees</span>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="tree-grid">
            {shown.map((t, i) => {
              const Icon = [Droplets, Wrench, Radio][i % 3];
              return (
                <Link
                  className="tree-card"
                  href={"/trees/" + t.slug}
                  key={t.id}
                >
                  <div className="card-visual">
                    <span className="domain-tag">
                      <Icon size={13} />
                      {t.tags[0]}
                    </span>
                    <span className="card-arrow">
                      <ArrowUpRight size={17} />
                    </span>
                    <MiniTree variant={i} />
                  </div>
                  <div className="card-copy">
                    <span className="card-category">
                      {t.tags[1] || "COLLABORATIVE IDEA"}
                    </span>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <div className="card-meta">
                      <span>
                        <GitBranch size={14} />
                        {nodes.filter((n) => n.tree_id === t.id).length}{" "}
                        contributions
                      </span>
                      <span>
                        <Users size={14} />
                        {
                          new Set(
                            nodes
                              .filter((n) => n.tree_id === t.id)
                              .map((n) => n.author_id),
                          ).size
                        }{" "}
                        minds
                      </span>
                    </div>
                    <div className="card-footer">
                      <span className="avatar tiny-avatar">
                        {people
                          .find((p) => p.id === t.creator_id)
                          ?.display_name.split(" ")
                          .map((x) => x[0])
                          .join("") || "YO"}
                      </span>
                      <span>
                        {people.find((p) => p.id === t.creator_id)
                          ?.display_name || "You"}
                      </span>
                      <span className="growing">
                        <span className="live-dot" /> Growing
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {!ready && (
            <div className="generation" role="status">
              Opening the living network…
              <div className="skeleton" />
              <div className="skeleton short" />
            </div>
          )}
          {ready && !shown.length && (
            <div className="empty">
              <Network size={32} />
              <h3>No branches here yet.</h3>
              <p>Try another search, or plant the first idea.</p>
              <Button
                onClick={() => {
                  setQuery("");
                  setTag("All ideas");
                  setDomain("All domains");
                  setStatus("Any status");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
          <div className="bottom-cta">
            <Network size={24} />
            <div>
              <h3>Every breakthrough starts with a “what if.”</h3>
              <p>You don’t need all the answers. Just a place to begin.</p>
            </div>
            <Link href="/trees/new">
              Plant your first idea <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <aside className="right-rail">
          <div className="rail-heading">
            <h3>The network, alive</h3>
            <span className="live-dot" />
          </div>
          <p className="muted small">A little progress, made together.</p>
          <div className="network-stats">
            <div>
              <strong>{trees.length.toString().padStart(2, "0")}</strong>
              <span>idea trees</span>
            </div>
            <div>
              <strong>{nodes.length}</strong>
              <span>contributions</span>
            </div>
            <div>
              <strong>
                {new Set(nodes.map((n) => n.author_id)).size
                  .toString()
                  .padStart(2, "0")}
              </strong>
              <span>curious minds</span>
            </div>
          </div>
          <div className="rail-divider" />
          <div className="rail-heading">
            <h3>Fresh off the branches</h3>
            <span className="subtle-pill">LIVE</span>
          </div>
          <div className="activity-list">
            {[...nodes]
              .reverse()
              .slice(0, 4)
              .map((n, i) => (
                <Link
                  key={n.id}
                  href={
                    "/trees/" +
                    trees.find((t) => t.id === n.tree_id)?.slug +
                    "/node/" +
                    n.id
                  }
                >
                  <span className={"avatar activity-avatar color-" + i}>
                    {people
                      .find((p) => p.id === n.author_id)
                      ?.display_name.split(" ")
                      .map((x) => x[0])
                      .join("") || "YO"}
                  </span>
                  <div>
                    <p>
                      <strong>
                        {people.find((p) => p.id === n.author_id)
                          ?.display_name || "You"}
                      </strong>{" "}
                      added a new {n.node_type}
                    </p>
                    <h4>{n.title}</h4>
                    <small>
                      {new Date(n.created_at).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      <span>·</span>{" "}
                      {trees.find((t) => t.id === n.tree_id)?.tags[0]}
                    </small>
                  </div>
                </Link>
              ))}
          </div>
          <div className="rail-divider" />
          <h3>People moving ideas forward</h3>
          <div className="contributors">
            {people.slice(0, 3).map((p, i) => (
              <Link key={p.id} href={"/profile/" + p.username}>
                <span className={"avatar color-" + i}>
                  {p.display_name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")}
                </span>
                <span>
                  <strong>{p.display_name}</strong>
                  <small>
                    {
                      [
                        "Environmental engineer",
                        "Hardware & open source",
                        "Community-centered design",
                      ][i]
                    }
                  </small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
          <div className="rail-quote">
            <span>“</span>
            <p>
              The next big thing might be
              <br />a small thing, shared.
            </p>
            <small>THAT’S THE IDEA.</small>
          </div>
          <span className="demo-label">
            {configured
              ? "Connected workspace"
              : "Demo workspace · sample contributors"}
          </span>
        </aside>
      </div>
      {landing && (
        <section className="manifesto">
          <span className="eyebrow">FROM DISCUSSION TO INVENTION</span>
          <h2>
            Comments bury good ideas.
            <br />
            <span className="serif">Give them somewhere to grow.</span>
          </h2>
          <div className="feature-grid">
            {[
              [
                "01",
                "Branch, don’t bury.",
                "Extend an idea, question an assumption, or solve one constraint. Every contribution has a place.",
              ],
              [
                "02",
                "Connect the unexpected.",
                "Bring two contributions together with AI and turn their shared potential into a practical blueprint.",
              ],
              [
                "03",
                "Credit every mind.",
                "Follow the people, decisions, and experiments behind an idea. Progress has a history.",
              ],
            ].map(([n, h, p]) => (
              <article key={n}>
                <span className="accent">{n}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
          <Button asChild>
            <Link href="/signup">
              Find your people. Build your idea. <ArrowUpRight size={16} />
            </Link>
          </Button>
        </section>
      )}
      <footer>
        <Link className="footer-logo" href="/">
          IdeaDNA
        </Link>
        <span>A little more possible, together.</span>
        <div>
          <Link href="/explore">Product</Link>
          <a
            href="https://github.com/topics/collective-intelligence"
            target="_blank"
            rel="noreferrer"
          >
            Open source
          </a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
