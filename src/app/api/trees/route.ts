import { NextResponse } from "next/server";
import { context, failure, readJSON, sameOrigin } from "@/lib/api";
import { treeInput } from "@/lib/validations";
import { serverDB } from "@/lib/supabase/server";
import { trees } from "@/lib/demo";
export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json(trees);
    const db = await serverDB();
    const { data, error } = await db
      .from("idea_trees")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db } = await context();
    const input = treeInput.parse(await readJSON(request));
    const { data, error } = await db.rpc("create_idea_tree", {
      payload: input,
    });
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
