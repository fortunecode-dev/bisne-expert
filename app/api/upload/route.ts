// ─── /api/upload ──────────────────────────────────────────────────────────────
// Image upload via storage driver (Blob in prod, fs/public in dev).
// Returns a public URL that works in both environments.

import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/storage'

function isAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

// POST /api/upload  multipart: field "image", optional "name" hint
export async function POST(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('image') as File | null
  const nameHint = (form.get('name') as string | null) ?? ''

  if (!file) return NextResponse.json({ error: 'No se recibió imagen' }, { status: 400 })

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return NextResponse.json({ error: 'Tipo de imagen no permitido' }, { status: 400 })

  const safeName = nameHint.replace(/[^a-z0-9\-_]/gi, '-').toLowerCase().slice(0, 40)
  const filename = `${Date.now()}${safeName ? '-' + safeName : ''}.${ext}`
  const key = `uploads/${filename}` // storage key

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const driver = await getDriver()
    const url = await driver.uploadFile(key, buffer, file.type)
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    console.error('[api/upload POST]', e)
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
  }
}

// DELETE /api/upload?key=uploads/filename.jpg
export async function DELETE(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const key = req.nextUrl.searchParams.get('key')
  if (!key || !key.startsWith('uploads/') || key.includes('..'))
    return NextResponse.json({ error: 'Clave inválida' }, { status: 400 })

  try {
    await (await getDriver()).deleteFile(key)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[api/upload DELETE]', e)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
