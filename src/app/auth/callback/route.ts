import { NextResponse, type NextRequest } from "next/server";
import { serverDB } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash && (type === "email" || type === "signup")) {
    const db = await serverDB();
    const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL("/explore", request.url));
  }
  if (code) {
    const db = await serverDB();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/explore", request.url));
  }
  return NextResponse.redirect(
    new URL("/login?error=confirmation", request.url),
  );
}
