import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const master = process.env.ADMIN_PASSWORD ?? 1234;

  if (!master) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD no está configurado en el servidor" },
      { status: 500 },
    );
  }
  if (password !== master) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });
  return res;
}
