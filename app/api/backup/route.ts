// ─── /api/backup ──────────────────────────────────────────────────────────────
// Downloads everything from the storage driver as a .zip file.
// Includes: all data/*.json files + all uploads/* images.
// Requires admin session. ZIP is structured to drop-in replace the project's
// data/ directory and public/uploads/ directory.

import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/storage'
import JSZip from 'jszip'

function isAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

export async function GET(req: NextRequest) {
  if (!isAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const driver = await getDriver()
    const zip = new JSZip()

    // ── JSON data files ────────────────────────────────────────────────────
    const jsonKeys = await driver.listJSONKeys()
    await Promise.all(
      jsonKeys.map(async (key) => {
        const raw = await driver.readRaw(key)
        if (raw) {
          // e.g. key "businesses" → zip path "data/businesses.json"
          //      key "business/slug" → zip path "data/business/slug.json"
          zip.file(`data/${key}.json`, raw)
        }
      })
    )

    // ── Image files ────────────────────────────────────────────────────────
    const fileKeys = await driver.listFileKeys('uploads/')
    await Promise.all(
      fileKeys.map(async (key) => {
        const buf = await driver.readFile(key)
        if (buf) {
          // key "uploads/filename.jpg" → zip path "public/uploads/filename.jpg"
          zip.file(`public/${key}`, buf)
        }
      })
    )

    // ── Generate ZIP ───────────────────────────────────────────────────────
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const now = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
    const filename = `catalogos-backup-${now}.zip`

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[api/backup]', e)
    return NextResponse.json({ error: 'Error al generar backup' }, { status: 500 })
  }
}
