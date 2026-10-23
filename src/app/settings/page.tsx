"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { browserDB, configured } from "@/lib/supabase/client";
import { people } from "@/lib/demo";
import type { Person } from "@/types";
export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<Person>(people[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      if (configured) {
        const db = browserDB();
        const {
          data: { user },
        } = await db.auth.getUser();
        if (!user) return;
        const { data } = await db
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      } else {
        try {
          setProfile(
            JSON.parse(localStorage.getItem("ideadna-profile") || "null") ||
              people[0],
          );
        } catch {}
      }
    }
    void load();
  }, []);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const f = new FormData(e.currentTarget);
    const p = {
      ...profile,
      display_name: String(f.get("name")),
      username: String(f.get("username")),
      bio: String(f.get("bio")),
    };
    try {
      if (configured) {
        const { error } = await browserDB()
          .from("profiles")
          .update({
            display_name: p.display_name,
            username: p.username,
            bio: p.bio,
          })
          .eq("id", p.id);
        if (error) throw error;
      } else localStorage.setItem("ideadna-profile", JSON.stringify(p));
      setProfile(p);
      window.dispatchEvent(new Event("ideadna-profile-updated"));
      setMessage("Your profile is up to date.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!configured) {
      setError("Connect Supabase to upload an avatar.");
      return;
    }
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPEG, or WebP under 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const db = browserDB();
      const path = `${profile.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
      const { error } = await db.storage.from("avatars").upload(path, file);
      if (error) throw error;
      const url = db.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error: err } = await db
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);
      if (err) throw err;
      setProfile({ ...profile, avatar_url: url });
      setMessage("Avatar updated.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-page">
      <span className="eyebrow">
        <Settings size={15} /> MAKE YOURSELF AT HOME
      </span>
      <h1>Your corner of the network.</h1>
      <p>A little about you helps the right collaborators find you.</p>
      {!configured && (
        <div className="notice">
          Demo profile. Preferences are stored in this browser.
        </div>
      )}
      <section className="form-panel">
        <div className="settings-section">
          <h2>Your profile</h2>
          <div className="author-line">
            {profile.avatar_url ? (
              <img
                className="avatar"
                src={profile.avatar_url}
                alt="Your avatar"
              />
            ) : (
              <span className="avatar">
                {profile.display_name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")}
              </span>
            )}
            <label className="text-link">
              <Upload size={14} />
              Upload avatar
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
                style={{ fontSize: 10 }}
              />
            </label>
          </div>
          <form
            className="form-stack"
            onSubmit={save}
            key={`${profile.id}-${profile.username}-${profile.display_name}-${profile.bio}`}
          >
            <label>
              Display name
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={profile.display_name}
              />
            </label>
            <label>
              Username
              <input
                name="username"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-z0-9_]+"
                defaultValue={profile.username}
              />
            </label>
            <label>
              Bio
              <textarea
                name="bio"
                rows={3}
                maxLength={500}
                defaultValue={profile.bio}
              />
            </label>
            <Button disabled={busy}>Save profile</Button>
          </form>
        </div>
        <div className="settings-section">
          <h2>Appearance</h2>
          <p className="small">
            Choose the space where your ideas feel at home.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {["dark", "light"].map((t) => (
              <Button
                key={t}
                variant="outline"
                onClick={() => {
                  document.documentElement.dataset.theme = t;
                  localStorage.setItem("ideadna-theme", t);
                  setMessage("Appearance updated.");
                }}
              >
                {t === "dark" ? "Dark workspace" : "Light workspace"}
              </Button>
            ))}
          </div>
        </div>
        {message && (
          <p role="status" className="success">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <Button
          variant="ghost"
          onClick={async () => {
            if (configured) await browserDB().auth.signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          <LogOut size={15} />
          Sign out
        </Button>
      </section>
    </div>
  );
}
