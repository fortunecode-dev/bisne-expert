// ─── /api/backup (v10) ────────────────────────────────────────────────────────
// Admin-only: genera y descarga un ZIP completo de todos los datos + media.
// Los backups automáticos por negocio nuevo se hacen en /api/biz-data.

import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/storage'
import JSZip from 'jszip'

function isAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

export async function GET(req: NextRequest) {
  if (!isAuth(req))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const driver = await getDriver()
    const zip    = new JSZip()

    // ── Todos los JSON ─────────────────────────────────────────────────────
    const jsonKeys = await driver.listJSONKeys()
    await Promise.all(
      jsonKeys.map(async (key) => {
        const raw = await driver.readRaw(key)
        if (raw) zip.file(`data/${key}.json`, raw)
      })
    )

    // ── Todas las imágenes ─────────────────────────────────────────────────
    const fileKeys = await driver.listFileKeys()
    await Promise.all(
      fileKeys.map(async (key) => {
        const buf = await driver.readFile(key)
        if (buf) zip.file(`uploads/${key}`, buf)
      })
    )

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const now      = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
    const filename = `catalogos-backup-full-${now}.zip`

    return new NextResponse(new Uint8Array(zipBuffer as Buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String((zipBuffer as Buffer).length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[api/backup]', e)
    return NextResponse.json({ error: 'Error al generar backup' }, { status: 500 })
  }
}
