import { adminDB } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { context, failure, readJSON, sameOrigin, ApiError } from "@/lib/api";
import { synthesisInput } from "@/lib/validations";
import { synthesize } from "@/lib/ai/synthesize";
import type { Idea } from "@/types";
export const maxDuration = 60;
export async function POST(request: Request) {
  let requestId: string | undefined;
  let dbRef: Awaited<ReturnType<typeof context>>["db"] | undefined;
  try {
    sameOrigin(request);
    const { db } = await context();
    dbRef = db;
    const v = synthesisInput.parse(await readJSON(request));
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new ApiError(
        "The workspace owner needs to configure synthesis storage.",
        503,
      );
    if (!process.env.GROQ_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY)
      throw new ApiError(
        "The workspace owner needs to configure an AI provider.",
        503,
      );
    const { data, error } = await db
      .from("idea_nodes")
      .select("*")
      .eq("tree_id", v.tree_id)
      .eq("status", "published")
      .in("id", [v.source_node_a_id, v.source_node_b_id]);
    if (error) throw error;
    if (data?.length !== 2)
      throw new ApiError(
        "Both contributions must be readable, published nodes in this tree.",
        404,
      );
    const { data: reserved, error: reserveError } = await db.rpc(
      "reserve_synthesis",
      {
        p_tree: v.tree_id,
        p_a: v.source_node_a_id,
        p_b: v.source_node_b_id,
        p_prompt: v.intent,
      },
    );
    if (reserveError)
      throw new ApiError(
        reserveError.message.includes("rate")
          ? "You have reached the synthesis limit. Try again in an hour."
          : "Unable to start synthesis.",
        429,
      );
    requestId = reserved as string;
    const a = data.find((n) => n.id === v.source_node_a_id) as Idea,
      b = data.find((n) => n.id === v.source_node_b_id) as Idea;
    const result = await synthesize(a, b, v.intent);
    const { data: node, error: saveError } = await adminDB().rpc(
      "complete_synthesis",
      {
        p_request: requestId,
        p_blueprint: result.blueprint,
        p_model: result.model,
      },
    );
    if (saveError) throw saveError;
    return NextResponse.json({ node, blueprint: result.blueprint });
  } catch (e) {
    if (dbRef && requestId)
      await dbRef.rpc("fail_synthesis", { p_request: requestId });
    return failure(e);
  }
}
