// ─── lib/backup.ts ────────────────────────────────────────────────────────────
// Builds a ZIP of all media for a given slug and saves it to the "backup" bucket.
// Called automatically after new business registration.
// Also used by /api/backup for full admin downloads.

import JSZip from 'jszip'
import { getDriver, storageKeys } from './storage'

// Timestamp string: "2025-01-23T14-05"
function ts(): string {
  return new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
}

// ── Per-business media backup ─────────────────────────────────────────────────
// Called after registration. Zips media/{slug}/* and saves to backup bucket.

export async function triggerBackup(slug: string): Promise<void> {
  const driver = await getDriver()
  const zip = new JSZip()

  // Include the business JSON
  const bizRaw = await driver.readRaw(storageKeys.business(slug))
  if (bizRaw) zip.file(`${slug}/business.json`, bizRaw)

  const prodRaw = await driver.readRaw(storageKeys.products(slug))
  if (prodRaw) zip.file(`${slug}/products.json`, prodRaw)

  // Include all images for this slug
  const imageKeys = await driver.listFileKeys(`${slug}/`)
  await Promise.all(
    imageKeys.map(async (k) => {
      const buf = await driver.readFile(k)
      if (buf) zip.file(`media/${k}`, buf)
    })
  )

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  // Filename: "2025-01-23_14-05_mi-negocio.zip"
  const filename = `${ts()}_${slug}.zip`
  await driver.saveBackup(filename, zipBuffer)
}

// ── Full backup (admin download) ──────────────────────────────────────────────
// Returns a Buffer of a ZIP containing all data JSON + all images.

export async function buildFullBackup(): Promise<{ buffer: Buffer; filename: string }> {
  const driver = await getDriver()
  const zip = new JSZip()

  // All JSON files
  const jsonKeys = await driver.listJSONKeys()
  await Promise.all(
    jsonKeys.map(async (key) => {
      const raw = await driver.readRaw(key)
      if (raw) zip.file(`data/${key}.json`, raw)
    })
  )

  // All image files
  const fileKeys = await driver.listFileKeys()
  await Promise.all(
    fileKeys.map(async (key) => {
      const buf = await driver.readFile(key)
      if (buf) zip.file(`uploads/${key}`, buf)
    })
  )

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  }) as Buffer

  return { buffer, filename: `catalogos-backup-${ts()}.zip` }
}
