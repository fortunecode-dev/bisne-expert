// ─── Storage Driver ───────────────────────────────────────────────────────────
// Abstraction layer over Vercel Blob (production) and local filesystem (dev).
// ALL storage operations go through this interface — never import fs or blob directly
// outside of this file and the drivers below.

export interface StorageDriver {
  // JSON data files
  readJSON(key: string): Promise<unknown | null>
  writeJSON(key: string, data: unknown): Promise<void>
  deleteJSON(key: string): Promise<void>
  listJSONKeys(prefix?: string): Promise<string[]>

  // Binary files (images)
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> // returns public URL
  deleteFile(key: string): Promise<void>
  listFileKeys(prefix?: string): Promise<string[]>

  // For backup: get raw content of a JSON file
  readRaw(key: string): Promise<Buffer | null>
  // For backup: get a file as buffer
  readFile(key: string): Promise<Buffer | null>
}

// ─── Driver selection ─────────────────────────────────────────────────────────
// Uses BLOB_READ_WRITE_TOKEN (set by Vercel) to decide which driver to use.
// In local dev: no token → filesystem driver.
// In Vercel: token present → blob driver.

let _driver: StorageDriver | null = null

export async function getDriver(): Promise<StorageDriver> {
  if (_driver) return _driver

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { BlobDriver } = await import('./storage.blob')
    _driver = new BlobDriver()
  } else {
    const { FsDriver } = await import('./storage.fs')
    _driver = new FsDriver()
  }

  return _driver
}

// ─── Key helpers ─────────────────────────────────────────────────────────────
// JSON keys: "businesses", "business/slug", "products/slug", "config"
// File keys: "uploads/timestamp-name.jpg"

export function isValidJsonKey(key: string): boolean {
  return /^[a-zA-Z0-9\-_/]+$/.test(key) && !key.includes('..')
}

export function isValidFileKey(key: string): boolean {
  return key.startsWith('uploads/') && !key.includes('..') && /^[a-zA-Z0-9\-_./]+$/.test(key)
}
