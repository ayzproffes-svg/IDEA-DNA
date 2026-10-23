"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dna,
  Compass,
  Network,
  Plus,
  ArrowUpRight,
  Sun,
  Moon,
  Settings,
  BookOpen,
  PanelLeftClose,
  ChartNoAxesCombined,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { browserDB, configured } from "@/lib/supabase/client";
import type { Person } from "@/types";
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [light, setLight] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  useEffect(() => {
    const v = localStorage.getItem("ideadna-theme") === "light";
    setLight(v);
    document.documentElement.dataset.theme = v ? "light" : "dark";
    if (!configured) {
      function loadDemoProfile() {
        try {
          setPerson(
            JSON.parse(localStorage.getItem("ideadna-profile") || "null"),
          );
        } catch {}
      }
      loadDemoProfile();
      window.addEventListener("ideadna-profile-updated", loadDemoProfile);
      return () =>
        window.removeEventListener("ideadna-profile-updated", loadDemoProfile);
    }
    const db = browserDB();
    async function load() {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) {
        setPerson(null);
        return;
      }
      const { data } = await db
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setPerson(data);
    }
    void load();
    const reloadProfile = () => {
      void load();
    };
    window.addEventListener("ideadna-profile-updated", reloadProfile);
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange(() => {
      setTimeout(() => void load(), 0);
    });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("ideadna-profile-updated", reloadProfile);
    };
  }, []);
  function theme() {
    localStorage.setItem("ideadna-theme", !light ? "light" : "dark");
    document.documentElement.dataset.theme = !light ? "light" : "dark";
    setLight(!light);
  }
  const nav = [
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Network, label: "Idea trees", href: "/trees" },
    { icon: Compass, label: "Judge demo", href: "/demo" },
    {
      icon: BookOpen,
      label: "Your contributions",
      href: person
        ? "/profile/" + person.username
        : configured
          ? "/login"
          : "/profile/mayachen",
    },
    {
      icon: ChartNoAxesCombined,
      label: "Network insights",
      href: "/dashboard",
    },
  ];
  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Dna size={27} />
          <span>
            Idea<span className="accent">DNA</span>
            <small>THE LIVING IDEAS NETWORK</small>
          </span>
        </Link>
        <div className="workspace">
          <span className="workspace-icon">i</span>
          <span>
            Open workspace<small>Good ideas grow together</small>
          </span>
          <PanelLeftClose size={15} />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Workspace">
          {nav.map(({ icon: Icon, label, href }) => (
            <Link
              aria-label={label}
              className={
                path === href || (path === "/" && href === "/explore")
                  ? "active"
                  : ""
              }
              href={href}
              key={label}
            >
              <Icon size={19} />
              {label}
              {label === "Explore" && <span className="tiny">NEW</span>}
            </Link>
          ))}
        </nav>
        <Button asChild className="new-button">
          <Link href="/trees/new">
            <Plus size={16} />
            Start an idea
          </Link>
        </Button>
        <div className="sidebar-bottom">
          <div className="note">
            <span className="accent">A small spark. A bigger possibility.</span>
            <p>Your perspective could be someone else’s missing piece.</p>
            <Link href="/trees/water-monitoring">
              Find an idea to build on <ArrowUpRight size={14} />
            </Link>
          </div>
          <button
            className="theme-button"
            onClick={theme}
            aria-label="Toggle color theme"
          >
            {light ? <Moon size={17} /> : <Sun size={17} />}{" "}
            {light ? "Dark appearance" : "Light appearance"}
          </button>
          <Link
            className="account"
            href="/settings"
            aria-label="Profile and settings"
          >
            {person?.avatar_url ? (
              <img className="avatar" src={person.avatar_url} alt="" />
            ) : (
              <span className="avatar">
                {person
                  ? person.display_name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                  : "MC"}
              </span>
            )}
            <span>
              {person?.display_name || "My workspace"}
              <small>Profile & preferences</small>
            </span>
            <Settings size={17} />
          </Link>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span>
            <span className="muted">Workspace</span>
            <span className="slash">/</span>
            {path === "/"
              ? "Welcome"
              : path.includes("/trees/")
                ? "Idea workspace"
                : path.includes("profile")
                  ? "Contributor profile"
                  : path.includes("settings")
                    ? "Settings"
                    : path.includes("dashboard")
                      ? "Network insights"
                      : "Explore ideas"}
          </span>
          <div>
            <span className="live-dot" /> Open minds. Shared progress.
            <Link
              href={person ? "/profile/" + person.username : "/login"}
              className="login-link"
            >
              {person ? "Your profile" : "Sign in"} <ArrowUpRight size={14} />
            </Link>
          </div>
        </header>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
