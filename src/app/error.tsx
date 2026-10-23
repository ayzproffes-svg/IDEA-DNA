"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="form-page">
      <span className="eyebrow">A MOMENTARY TANGLE</span>
      <h1>This branch needs a moment.</h1>
      <p>
        We couldn’t load this part of the network. Try again, or head back to
        the ideas.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/explore">Explore ideas</Link>
        </Button>
      </div>
    </div>
  );
}
