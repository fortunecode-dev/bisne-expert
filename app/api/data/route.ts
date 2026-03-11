// ─── /api/data ────────────────────────────────────────────────────────────────
// CRUD for JSON data files via storage driver (Blob in prod, fs in dev).

import { NextRequest, NextResponse } from "next/server";
import { getDriver, isValidJsonKey } from "@/lib/storage";

function isAuth(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("file");
  if (!key || !isValidJsonKey(key))
    return NextResponse.json({ error: "Clave inválida" }, { status: 400 });

  try {
    const data = await (await getDriver()).readJSON(key);
    if (data === null)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/data GET]", e);
    return NextResponse.json(
      { error: "Error al leer", stack: e },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuth(req))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { file, data } = await req.json();
  if (!file || !isValidJsonKey(file) || data === undefined)
    return NextResponse.json(
      { error: "Parámetros inválidos" },
      { status: 400 },
    );

  try {
    await (await getDriver()).writeJSON(file, data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/data POST]", e);
    return NextResponse.json(
      { error: "Error al guardar", stack: e },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuth(req))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const key = req.nextUrl.searchParams.get("file");
  if (!key || !isValidJsonKey(key))
    return NextResponse.json({ error: "Clave inválida" }, { status: 400 });

  try {
    await (await getDriver()).deleteJSON(key);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/data DELETE]", e);
    return NextResponse.json(
      { error: "Error al eliminar", stack: e },
      { status: 500 },
    );
  }
}
