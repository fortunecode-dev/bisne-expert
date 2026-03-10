import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

function isAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

// POST /api/upload  multipart: field "image", optional "name" hint
export async function POST(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  fs.mkdirSync(UPLOADS_DIR, { recursive: true })

  const form = await req.formData()
  const file = form.get('image') as File | null
  const nameHint = (form.get('name') as string | null) ?? ''

  if (!file) return NextResponse.json({ error: 'No se recibió imagen' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de imagen no permitido' }, { status: 400 })
  }

  const ext = file.type === 'image/svg+xml' ? 'svg'
    : file.type === 'image/jpeg' ? 'jpg'
    : file.type.split('/')[1]

  const safeName = nameHint.replace(/[^a-z0-9\-_]/gi, '-').toLowerCase().slice(0, 40)
  const filename = `${Date.now()}${safeName ? '-' + safeName : ''}.${ext}`
  const filePath = path.join(UPLOADS_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` })
}

// DELETE /api/upload?url=/uploads/filename.jpg
export async function DELETE(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const urlParam = req.nextUrl.searchParams.get('url')
  if (!urlParam?.startsWith('/uploads/')) {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  const filename = path.basename(urlParam)
  if (filename.includes('..')) return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 })

  const filePath = path.join(UPLOADS_DIR, filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  return NextResponse.json({ ok: true })
}
