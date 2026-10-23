import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverDB } from "@/lib/supabase/server";
export async function context() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
    throw new ApiError("Connect Supabase to use the shared workspace.", 503);
  const db = await serverDB();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new ApiError("Sign in to continue.", 401);
  return { db, user };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function failure(e: unknown) {
  if (e instanceof ZodError)
    return NextResponse.json(
      { error: e.issues.map((i) => i.message).join(" ") },
      { status: 400 },
    );
  if (e instanceof ApiError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(
    "IdeaDNA request failed:",
    e instanceof Error ? e.message : "Unknown error",
  );
  return NextResponse.json(
    { error: "The request could not be completed. Please try again." },
    { status: 500 },
  );
}
export async function readJSON(r: Request) {
  if (Number(r.headers.get("content-length") || 0) > 30000)
    throw new ApiError("Request is too large.", 413);
  const text = await r.text();
  if (text.length > 30000) throw new ApiError("Request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("Send valid JSON.");
  }
}
export function sameOrigin(r: Request) {
  const origin = r.headers.get("origin");
  if (origin && origin !== new URL(r.url).origin)
    throw new ApiError("This origin is not allowed.", 403);
}
