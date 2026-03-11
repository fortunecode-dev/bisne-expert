// ─── /api/data ────────────────────────────────────────────────────────────────
// CRUD for JSON data files via storage driver (Blob in prod, fs in dev).
// Access rules:
//   GET  - always public (products/businesses are public catalog data)
//   POST/DELETE - admin_session  OR  biz-owner writing their own slug

import { NextRequest, NextResponse } from 'next/server'
import { getDriver, isValidJsonKey } from '@/lib/storage'

function isAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

// Check if this is a biz-owner writing data for their own slug.
// Allowed keys: business/<slug>, products/<slug>
function isBizOwnerAuth(req: NextRequest, key: string): boolean {
  const match = key.match(/^(?:business|products)\/([a-z0-9-]+)$/)
  if (!match) return false
  const slug = match[1]
  return req.cookies.get(`biz_session_${slug}`)?.value === 'authenticated'
}

// Also allow biz-owners to update their own entry in businesses.json
// This is handled by a dedicated /api/biz-data route instead

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('file')
  if (!key || !isValidJsonKey(key))
    return NextResponse.json({ error: 'Clave inválida' }, { status: 400 })

  try {
    const data = await (await getDriver()).readJSON(key)
    if (data === null) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(data)
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

  const allowed = isAdminAuth(req) || isBizOwnerAuth(req, file)
  if (!allowed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    await (await getDriver()).writeJSON(file, data)
    return NextResponse.json({ ok: true })
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
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[api/data DELETE]', e)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
