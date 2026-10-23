import { NextResponse } from "next/server";
import { z } from "zod";
import { context, failure, readJSON, sameOrigin, ApiError } from "@/lib/api";
import { serverDB } from "@/lib/supabase/server";
import { entryInput, reviewInput } from "@/lib/validations/innovation";
export async function GET(r: Request) {
  try {
    const entry = new URL(r.url).searchParams.get("entry_id");
    if (entry) {
      const db = await serverDB();
      const { data, error } = await db
        .from("innovation_events")
        .select("*")
        .eq("entry_id", z.uuid().parse(entry))
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new ApiError("Could not load review history.", 503);
      return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    const id = z.uuid().parse(new URL(r.url).searchParams.get("tree_id"));
    const db = await serverDB();
    const { data, error } = await db
      .from("innovation_entries")
      .select("*")
      .eq("tree_id", id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error)
      throw new ApiError(
        "Innovation records are unavailable. Apply the innovation migration before enabling this feature.",
        503,
      );
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const { db } = await context();
    const v = entryInput.parse(await readJSON(r));
    const { data, error } = await db
      .from("innovation_entries")
      .insert(v)
      .select()
      .single();
    if (error)
      throw new ApiError(
        error.code === "23505"
          ? "This connection already exists."
          : "Could not save. Check your access and the database upgrade.",
        400,
      );
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(r: Request) {
  try {
    sameOrigin(r);
    const { db, user } = await context();
    const { id, ...v } = reviewInput.parse(await readJSON(r));
    const { data, error } = await db
      .from("innovation_entries")
      .update({ ...v, reviewed_by: user.id })
      .eq("id", id)
      .select()
      .single();
    if (error)
      throw new ApiError("Only the project owner can review this record.", 403);
    return NextResponse.json(data);
  } catch (e) {
    return failure(e);
  }
}
