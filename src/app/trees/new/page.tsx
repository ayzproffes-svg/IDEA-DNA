"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitBranch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdeas } from "@/hooks/use-ideas";
import { browserDB, configured } from "@/lib/supabase/client";
import { people } from "@/lib/demo";
export default function NewTree() {
  const store = useIdeas();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<string | null>(
    configured ? null : people[0].id,
  );
  useEffect(() => {
    if (configured)
      void browserDB()
        .auth.getUser()
        .then(({ data }) => setUser(data.user?.id || null));
  }, []);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!user) throw Error("Sign in before starting an idea.");
      const f = new FormData(e.currentTarget);
      const title = String(f.get("title")).trim(),
        id = crypto.randomUUID(),
        slug =
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 65) +
          "-" +
          id.slice(0, 6),
        created_at = new Date().toISOString();
      await store.addTree(
        {
          id,
          slug,
          title,
          description: String(f.get("description")),
          tags: String(f.get("tags"))
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          creator_id: user,
          visibility: f.get("visibility") as "public" | "unlisted" | "private",
          created_at,
        },
        {
          id: crypto.randomUUID(),
          tree_id: id,
          parent_id: null,
          title,
          content: String(f.get("content")),
          author_id: user,
          node_type: "root",
          status: "published",
          metadata: {},
          contribution_score: 0,
          created_at,
        },
      );
      router.push("/trees/" + slug);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-page">
      <Link className="back-link" href="/trees">
        <ArrowLeft size={14} /> Back to idea trees
      </Link>
      <span className="eyebrow" style={{ marginTop: 35 }}>
        <GitBranch size={16} /> PLANT A POSSIBILITY
      </span>
      <h1>It starts with a small idea.</h1>
      <p>
        Give your idea a clear starting point. The details don’t have to be
        perfect — leave room for someone else to make it better.
      </p>
      {!configured && (
        <div className="notice">
          Demo mode: your idea will be saved in this browser. Connect Supabase
          to share it with others.
        </div>
      )}
      <form className="form-panel form-stack" onSubmit={create}>
        <label>
          What’s your idea?
          <input
            name="title"
            required
            minLength={5}
            maxLength={140}
            placeholder="A clear, memorable title"
            autoFocus
          />
        </label>
        <label>
          The idea in a sentence
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={500}
            rows={2}
            placeholder="What could exist, and who would it help?"
          />
        </label>
        <label>
          The starting point
          <textarea
            name="content"
            required
            minLength={20}
            maxLength={10000}
            rows={6}
            placeholder="Describe the problem, your initial approach, and where you could use another perspective."
          />
        </label>
        <div className="form-row">
          <label>
            Topics
            <input
              name="tags"
              maxLength={200}
              placeholder="Climate tech, Hardware"
            />
          </label>
          <label>
            Who can see it?
            <select name="visibility">
              <option value="public">Public — discoverable by everyone</option>
              <option value="unlisted">Unlisted — anyone with the link</option>
              <option value="private">Private — just you</option>
            </select>
          </label>
        </div>
        {!user && (
          <p>
            <Link href="/login" className="accent">
              Sign in
            </Link>{" "}
            to start a tree.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Button disabled={busy || !user}>
          {busy ? "Planting your idea…" : "Create idea tree"}
          <ArrowRight size={16} />
        </Button>
        <small className="muted">
          Your contribution will always be credited to you.
        </small>
      </form>
    </div>
  );
}
