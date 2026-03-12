import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDriver } from "@/lib/storage";

const SALT = process.env.BIZ_SALT || "catalogos-salt-2025";

function hashPwd(pwd: string): string {
  return crypto
    .createHash("sha256")
    .update(pwd + SALT)
    .digest("hex");
}

// Simple signed token: base64(slug:timestamp):signature
function makeToken(slug: string): string {
  const payload = Buffer.from(`${slug}:${Date.now()}`).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SALT)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  const { slug, password } = await req.json();
  if (!slug || !password)
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  const driver = await getDriver();
  const bizData: any = await driver.readJSON("businesses");
  const business = bizData?.businesses?.find(
    (b: any) => b.slug === slug || b.ownerCode === slug.toUpperCase(),
  );
  if (!business)
    return NextResponse.json(
      { error: "Negocio no encontrado" },
      { status: 404 },
    );
  if (!business.ownerPasswordHash)
    return NextResponse.json(
      { error: "Sin contraseña configurada" },
      { status: 403 },
    );
  if (business.ownerPasswordHash !== hashPwd(password)) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true, slug: business.slug });
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  };
  // Session cookie (owner)
  res.cookies.set(`biz_session_${business.slug}`, "authenticated", cookieOpts);
  // Signed token cookie for preview access (non-httpOnly so JS can read if needed)
  res.cookies.set(`biz_token_${business.slug}`, makeToken(business.slug), {
    ...cookieOpts,
    httpOnly: false,
  });
  res.headers.set('Cache-Control', 'no-store, no-cache')
  return res;
}
