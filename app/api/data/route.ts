// ─── /api/data (v10) ─────────────────────────────────────────────────────────
// CRUD genérico para archivos JSON.
// Keys válidas: "{slug}/business", "{slug}/products", "config", "reports"
// GET  — público, sin cache de browser (el cache de servidor lo maneja lib/cache.ts)
// POST/DELETE — requiere admin o biz-owner; invalida cache después de escribir

import { NextRequest, NextResponse } from 'next/server'
import { getDriver, isValidJsonKey } from '@/lib/storage'
import { invalidateKey } from '@/lib/cache'

const NO_STORE = { 'Cache-Control': 'no-store' }

function isAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

// Verifica que el dueño del negocio sea el que escribe sus propios archivos
function isBizOwnerAuth(req: NextRequest, key: string): boolean {
  // key: "{slug}/business" o "{slug}/products"
  const m = key.match(/^([a-z0-9-]+)\/(business|products)$/)
  if (!m) return false
  return req.cookies.get(`biz_session_${m[1]}`)?.value === 'authenticated'
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('file')
  if (!key || !isValidJsonKey(key))
    return NextResponse.json({ error: 'Clave inválida' }, { status: 400 })

  try {
    const data = await (await getDriver()).readJSON(key)
    if (data === null) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(data, { headers: NO_STORE })
  } catch (e) {
    console.error('[api/data GET]', e)
    return NextResponse.json({ error: 'Error al leer' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { file, data } = body
  if (!file || !isValidJsonKey(file) || data === undefined)
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  if (!isAdminAuth(req) && !isBizOwnerAuth(req, file))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    await (await getDriver()).writeJSON(file, data)
    invalidateKey(file)
    return NextResponse.json({ ok: true }, { headers: NO_STORE })
  } catch (e) {
    console.error('[api/data POST]', e)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('file')
  if (!key || !isValidJsonKey(key))
    return NextResponse.json({ error: 'Clave inválida' }, { status: 400 })

  if (!isAdminAuth(req) && !isBizOwnerAuth(req, key))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    await (await getDriver()).deleteJSON(key)
    invalidateKey(key)
    return NextResponse.json({ ok: true }, { headers: NO_STORE })
  } catch (e) {
    console.error('[api/data DELETE]', e)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
