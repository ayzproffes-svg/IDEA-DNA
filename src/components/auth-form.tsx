"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Dna } from "lucide-react";
import { browserDB, configured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MiniTree } from "@/components/discover";
export function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [emailRateLimited, setEmailRateLimited] = useState(false);
  function showAuthError(value: unknown) {
    const failure = value as { code?: string; message?: string };
    if (
      failure.code === "over_email_send_rate_limit" ||
      /email.*rate.*limit/i.test(failure.message || "")
    ) {
      setEmailRateLimited(true);
      setError(
        "The email-sending limit has been reached for this project. Please wait for it to reset before requesting another email. Changing browsers will not reset it.",
      );
    } else
      setError(
        failure.message || "Unable to complete this request. Please try again.",
      );
  }
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("error") === "confirmation" || fragment.has("error")) {
      setError(
        "This confirmation link could not be verified. Enter your email below and request a fresh link. Open it in the browser where you signed up.",
      );
      setNeedsConfirmation(true);
      if (window.location.hash)
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
    }
  }, []);
  async function resend() {
    setError("");
    setMessage("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter your signup email address first.");
      return;
    }
    setBusy(true);
    try {
      if (!configured)
        throw Error("Connect Supabase to send confirmation emails.");
      const { error } = await browserDB().auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin + "/auth/callback" },
      });
      if (error) throw error;
      setMessage(
        "If this account needs confirmation, a fresh email has been requested. Use the newest link and check your spam folder.",
      );
    } catch (e) {
      showAuthError(e);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!configured)
        throw Error(
          "This is a demo workspace. Connect Supabase using the setup guide to enable accounts.",
        );
      const f = new FormData(e.currentTarget),
        email = String(f.get("email")),
        password = String(f.get("password"));
      const db = browserDB();
      if (signup) {
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: String(f.get("name")) },
            emailRedirectTo: window.location.origin + "/auth/callback",
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/explore");
          router.refresh();
        } else {
          setNeedsConfirmation(true);
          setMessage(
            "Check your email to confirm your account, then come back to sign in.",
          );
        }
      } else {
        if (email.trim().toLowerCase() === "admin1") {
          const response = await fetch("/api/auth/owner-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: "admin1", password }),
          });
          const result = await response.json();
          if (!response.ok) throw Error(result.error || "Unable to sign in.");
          window.location.assign("/explore");
          return;
        }
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.code === "email_not_confirmed") setNeedsConfirmation(true);
          throw error;
        }
        router.push("/explore");
        router.refresh();
      }
    } catch (e) {
      showAuthError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <span className="eyebrow">
          <Dna size={20} /> THE LIVING IDEAS NETWORK
        </span>
        <h1>
          A thought of yours.
          <br />
          <span className="serif">A possibility for all.</span>
        </h1>
        <p>
          Join a community that builds on ideas, gives credit, and turns “what
          if” into “what’s next.”
        </p>
        <MiniTree variant={5} />
        <small className="muted">
          Every branch begins with someone like you.
        </small>
      </section>
      <section className="auth-form">
        <span className="eyebrow">WELCOME TO IDEADNA</span>
        <h2 style={{ marginTop: 20 }}>
          {signup ? "Make room for your ideas." : "Good to have you back."}
        </h2>
        <p>
          {signup
            ? "A little curiosity goes a long way."
            : "Pick up where your curiosity left off."}
        </p>
        <form onSubmit={submit}>
          {signup && (
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Maya Chen"
              />
            </label>
          )}
          <label>
            {signup ? "Email address" : "Email address or username"}
            <input
              name="email"
              type={signup ? "email" : "text"}
              autoComplete={signup ? "email" : "username"}
              required
              placeholder={
                signup ? "you@example.com" : "you@example.com or admin1"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={128}
              placeholder="At least 8 characters"
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="success">
              {message}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "One moment…" : signup ? "Create your account" : "Sign in"}
            <ArrowRight size={16} />
          </Button>
          {needsConfirmation && (
            <Button
              type="button"
              variant="outline"
              disabled={busy || emailRateLimited}
              onClick={resend}
            >
              {emailRateLimited
                ? "Email limit reached — try later"
                : "Resend confirmation email"}
            </Button>
          )}
          <p>
            {signup ? "Already part of the network?" : "New to IdeaDNA?"}{" "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
        <p className="auth-note">
          By continuing, you agree to our <Link href="/terms">terms</Link> and{" "}
          <Link href="/privacy">privacy policy</Link>. Curious first?{" "}
          <Link href="/explore">Explore the demo.</Link>
        </p>
      </section>
    </div>
  );
}
