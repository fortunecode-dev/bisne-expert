import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SALT = process.env.BIZ_SALT || "catalogos-salt-2025";

function verifyToken(token: string): string | null {
  try {
    const [payload, sig] = token.split(".");
    const expected = crypto
      .createHmac("sha256", SALT)
      .update(payload)
      .digest("hex")
      .slice(0, 16);
    if (sig !== expected) return null;
    const decoded = Buffer.from(payload, "base64url").toString();
    const [slug, ts] = decoded.split(":");
    // Token valid for 30 days
    if (Date.now() - parseInt(ts) > 30 * 24 * 60 * 60 * 1000) return null;
    return slug;
  } catch {
    return null;
  }
}
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ authed: false });

  const isAdmin = req.cookies.get("admin_session")?.value === "authenticated";
  const isOwner =
    req.cookies.get(`biz_session_${slug}`)?.value === "authenticated";

  // Also accept signed token (for preview without password re-entry)
  const token = req.cookies.get(`biz_token_${slug}`)?.value;
  const tokenSlug = token ? verifyToken(token) : null;
  const hasToken = tokenSlug === slug;

  return NextResponse.json(
    { authed: isAdmin || isOwner || hasToken, isAdmin, isOwner: isOwner || hasToken },
    { headers: { 'Cache-Control': 'no-store, no-cache' } }
  );
}
