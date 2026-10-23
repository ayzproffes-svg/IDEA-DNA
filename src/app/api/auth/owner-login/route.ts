import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin, readJSON, ApiError, failure } from "@/lib/api";
import { serverDB } from "@/lib/supabase/server";
import { adminDB } from "@/lib/supabase/admin";
const input = z.object({
  identifier: z.literal("admin1"),
  password: z.string().min(1).max(256),
});
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const parsed = input.safeParse(await readJSON(request));
    if (!parsed.success) throw new ApiError("Invalid login credentials.", 401);
    const ownerId = process.env.IDEADNA_OWNER_USER_ID;
    if (!ownerId || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new ApiError("Owner sign-in is not configured yet.", 503);
    // Resolve only the configured account. No email lookup or identity choice comes from the caller.
    const owner = await adminDB().auth.admin.getUserById(ownerId);
    if (owner.error || !owner.data.user?.email)
      throw new ApiError("Owner sign-in is temporarily unavailable.", 503);
    const db = await serverDB();
    // Supabase validates its salted password hash and applies its authentication rate limits.
    const result = await db.auth.signInWithPassword({
      email: owner.data.user.email,
      password: parsed.data.password,
    });
    if (result.error)
      throw new ApiError(
        result.error.status === 429
          ? "Too many sign-in attempts. Please wait before trying again."
          : "Invalid login credentials.",
        result.error.status === 429 ? 429 : 401,
      );
    if (result.data.user?.id !== ownerId) {
      await db.auth.signOut({ scope: "local" });
      throw new ApiError("Invalid login credentials.", 401);
    }
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const response = failure(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
