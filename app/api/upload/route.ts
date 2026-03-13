// ─── /api/upload (v10) ────────────────────────────────────────────────────────
// Sube imágenes a uploads/{slug}/{timestamp}-{name}.ext
// El slug agrupa las imágenes por negocio en el bucket.
// Se extrae del campo "slug" del formulario o de la cookie biz_session_.

import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/storage'

function isAuth(req: NextRequest): boolean {
  if (req.cookies.get('admin_session')?.value === 'authenticated') return true
  return req.cookies.getAll().some(c => c.name.startsWith('biz_session_') && c.value === 'authenticated')
}

function resolveSlug(req: NextRequest, formSlug: string | null): string {
  if (formSlug && /^[a-z0-9-]+$/.test(formSlug)) return formSlug
  // Fallback: primera biz_session_ activa
  const c = req.cookies.getAll().find(c => c.name.startsWith('biz_session_') && c.value === 'authenticated')
  if (c) return c.name.replace('biz_session_', '')
  return 'shared'
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif':  'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif',
}

export async function POST(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form     = await req.formData()
  const file     = form.get('image') as File | null
  const nameHint = (form.get('name') as string | null) ?? ''
  const slugHint = form.get('slug') as string | null

  if (!file) return NextResponse.json({ error: 'No se recibió imagen' }, { status: 400 })
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return NextResponse.json({ error: 'Tipo de imagen no permitido' }, { status: 400 })

  const slug     = resolveSlug(req, slugHint)
  const safeName = nameHint.replace(/[^a-z0-9\-_]/gi, '-').toLowerCase().slice(0, 40)
  const filename = `${Date.now()}${safeName ? '-' + safeName : ''}.${ext}`
  // key: "{slug}/{filename}" — sin prefijo "uploads/"
  const key = `${slug}/${filename}`

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const url    = await (await getDriver()).uploadFile(key, buffer, file.type)
    return NextResponse.json({ ok: true, url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[api/upload POST]', e)
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const key = req.nextUrl.searchParams.get('key')
  if (!key || key.includes('..') || !/^[a-zA-Z0-9\-_./]+$/.test(key))
    return NextResponse.json({ error: 'Clave inválida' }, { status: 400 })

  try {
    await (await getDriver()).deleteFile(key)
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[api/upload DELETE]', e)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
