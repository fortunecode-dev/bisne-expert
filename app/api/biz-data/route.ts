// /api/biz-data (v10) — Registrar y editar negocios.
//
// Cambio estructural:
//   ANTES: leía/escribía un businesses.json central con un array
//   AHORA: cada negocio vive en {slug}/business.json independiente.
//          "listar negocios" = listar el bucket, no leer un array.
//
// Al registrar un negocio nuevo:
//   1. Escribe {slug}/business.json
//   2. Crea {slug}/products.json vacío
//   3. Invalida cache
//   4. Dispara backup asíncrono al bucket "backup" con fecha+slug en el nombre

import { NextRequest, NextResponse } from 'next/server'
import { getDriver, storageKeys } from '@/lib/storage'
import { invalidateKeys } from '@/lib/cache'
import JSZip from 'jszip'

const NO_STORE = { 'Cache-Control': 'no-store, no-cache' }

function isAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}
function isBizOwnerAuth(req: NextRequest, slug: string) {
  return req.cookies.get(`biz_session_${slug}`)?.value === 'authenticated'
}

// Genera nombre de archivo de backup: "2025-01-23_14-05_mi-negocio.zip"
function backupFilename(slug: string): string {
  const now = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
  return `${now}_${slug}.zip`
}

// Crea el ZIP con la media del negocio y lo guarda en el bucket "backup".
// Se llama de forma fire-and-forget después de registrar.
async function runBackup(slug: string): Promise<void> {
  const driver = await getDriver()
  const zip = new JSZip()

  // Incluir el business.json recién creado
  const bizRaw = await driver.readRaw(storageKeys.business(slug))
  if (bizRaw) zip.file(`${slug}/business.json`, bizRaw)

  const prodRaw = await driver.readRaw(storageKeys.products(slug))
  if (prodRaw) zip.file(`${slug}/products.json`, prodRaw)

  // Incluir todas las imágenes del slug (puede estar vacío en registro inicial)
  const mediaKeys = await driver.listFileKeys(`${slug}/`)
  await Promise.all(
    mediaKeys.map(async (k) => {
      const buf = await driver.readFile(k)
      if (buf) zip.file(`media/${k}`, buf)
    })
  )

  const zipBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  }) as Buffer

  await driver.saveBackup(backupFilename(slug), zipBuf)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, updates, isNew, ownerPasswordHash, ownerCode } = body

  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: 'slug inválido' }, { status: 400 })

  const driver = await getDriver()

  // ── Registrar negocio nuevo ───────────────────────────────────────────────
  if (isNew) {
    // Verificar que el slug no exista ya
    const existing = await driver.readJSON(storageKeys.business(slug))
    if (existing)
      return NextResponse.json({ error: `El slug "${slug}" ya está en uso` }, { status: 409 })

    const newBiz = {
      ...updates,
      slug,
      ownerPasswordHash,
      ownerCode,
      hidden: true,
      created_at: new Date().toISOString(),
    }

    // Escribir archivos independientes
    await driver.writeJSON(storageKeys.business(slug), newBiz)
    await driver.writeJSON(storageKeys.products(slug), { products: [] })

    // Invalidar cache de la lista de negocios
    invalidateKeys([storageKeys.business(slug)])

    // Backup asíncrono — no bloquea la respuesta
    runBackup(slug).catch(e => console.error('[biz-data] backup failed:', e))

    return NextResponse.json({ ok: true, slug, code: ownerCode }, { headers: NO_STORE })
  }

  // ── Editar negocio existente ──────────────────────────────────────────────
  if (!isAdminAuth(req) && !isBizOwnerAuth(req, slug))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const existing: any = await driver.readJSON(storageKeys.business(slug))
  if (!existing)
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const ownerAllowed = [
    'name', 'description', 'slogan', 'logo', 'image', 'unavailable',
    'categories', 'seo', 'coverImages',
  ]
  const adminAllowed = [
    ...ownerAllowed,
    'sponsored', 'premium', 'hidden', 'slug',
    'ownerPasswordHash', 'ownerCode',
  ]
  const allowed = isAdminAuth(req) ? adminAllowed : ownerAllowed

  const safe: any = {}
  for (const k of allowed) if (k in updates) safe[k] = updates[k]

  await driver.writeJSON(storageKeys.business(slug), { ...existing, ...safe })
  invalidateKeys([storageKeys.business(slug)])

  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}
