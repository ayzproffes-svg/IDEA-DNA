import { NextResponse } from "next/server";
import { z } from "zod";
import { context, failure, readJSON, sameOrigin } from "@/lib/api";
import { nodeInput } from "@/lib/validations";
import { serverDB } from "@/lib/supabase/server";
import { demoNodes } from "@/lib/demo";
export async function GET(request: Request) {
  try {
    const treeId = new URL(request.url).searchParams.get("tree_id");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
      return NextResponse.json(
        demoNodes.filter((n) => !treeId || n.tree_id === treeId),
      );
    const db = await serverDB();
    let q = db
      .from("idea_nodes")
      .select("*")
      .eq("status", "published")
      .order("created_at")
      .limit(500);
    if (treeId) q = q.eq("tree_id", z.uuid().parse(treeId));
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await context();
    const input = nodeInput.parse(await readJSON(request));
    const { data, error } = await db.rpc("add_contribution", {
      payload: { ...input, author_id: user.id },
    });
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { db } = await context();
    const input = z
      .object({
        id: z.uuid(),
        title: z.string().trim().min(5).max(140).optional(),
        content: z.string().trim().min(20).max(10000).optional(),
        change_reason: z.string().trim().max(1000).optional(),
        status: z.enum(["published", "archived"]).optional(),
      })
      .parse(await readJSON(request));
    const { id, ...patch } = input;
    const { data, error } = await db
      .from("idea_nodes")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return failure(e);
  }
}
