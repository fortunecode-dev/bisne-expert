// ─── /api/data ────────────────────────────────────────────────────────────────
// CRUD for JSON data files via storage driver.
// GET  — public, cached via Next.js Data Cache (7 days, tagged)
// POST/DELETE — requires admin or biz-owner auth; invalidates cache on success

import { NextRequest, NextResponse } from 'next/server'
import { getDriver, isValidJsonKey } from '@/lib/storage'
import { invalidateKey } from '@/lib/cache'

function isAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

function isBizOwnerAuth(req: NextRequest, key: string): boolean {
  const match = key.match(/^(?:business|products)\/([a-z0-9-]+)$/)
  if (!match) return false
  const slug = match[1]
  return req.cookies.get(`biz_session_${slug}`)?.value === 'authenticated'
}

// ── GET — cached ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('file')
  if (!key || !isValidJsonKey(key))
    return NextResponse.json({ error: 'Clave inválida' }, { status: 400 })

  try {
    const data = await (await getDriver()).readJSON(key)
    if (data === null) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    return NextResponse.json(data, {
      headers: {
        // No browser cache — data mutates frequently and must always be fresh on client.
        // Server-side caching (7 days) is handled by lib/cache.ts via unstable_cache().
        // If a CDN sits in front, it will also respect no-store.
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[api/data GET]', e)
    return NextResponse.json({ error: 'Error al leer' }, { status: 500 })
  }
}

// ── POST — write + invalidate ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { file, data } = body

  if (!file || !isValidJsonKey(file) || data === undefined)
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  const allowed = isAdminAuth(req) || isBizOwnerAuth(req, file)
  if (!allowed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    await (await getDriver()).writeJSON(file, data)
    // Invalidate AFTER successful write
    invalidateKey(file)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[api/data POST]', e)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

// ── DELETE — remove + invalidate ──────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('file')
  if (!key || !isValidJsonKey(key))
    return NextResponse.json({ error: 'Clave inválida' }, { status: 400 })

  if (!isAdminAuth(req) && !isBizOwnerAuth(req, key))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    await (await getDriver()).deleteJSON(key)
    // Invalidate AFTER successful delete
    invalidateKey(key)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[api/data DELETE]', e)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
