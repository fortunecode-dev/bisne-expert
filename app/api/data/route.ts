import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

function isAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

function safePath(fileParam: string): string | null {
  if (!/^[a-zA-Z0-9\-_/]+$/.test(fileParam)) return null
  const resolved = path.resolve(DATA_DIR, fileParam + '.json')
  // Prevent path traversal
  if (!resolved.startsWith(DATA_DIR + path.sep) && resolved !== DATA_DIR) return null
  return resolved
}

// GET /api/data?file=businesses
// GET /api/data?file=business/slug
// GET /api/data?file=products/slug
// GET /api/data?file=config
export async function GET(req: NextRequest) {
  const fileParam = req.nextUrl.searchParams.get('file')
  if (!fileParam) return NextResponse.json({ error: 'Falta el parámetro file' }, { status: 400 })

  const filePath = safePath(fileParam)
  if (!filePath) return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 })

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'Error al leer' }, { status: 500 })
  }
}

// POST /api/data  body: { file: string, data: object }
export async function POST(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { file, data } = await req.json()
  if (!file || data === undefined) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const filePath = safePath(file)
  if (!filePath) return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 })

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al escribir' }, { status: 500 })
  }
}

// DELETE /api/data?file=business/slug
export async function DELETE(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const fileParam = req.nextUrl.searchParams.get('file')
  if (!fileParam) return NextResponse.json({ error: 'Falta el parámetro file' }, { status: 400 })

  const filePath = safePath(fileParam)
  if (!filePath) return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 })

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  return NextResponse.json({ ok: true })
}
