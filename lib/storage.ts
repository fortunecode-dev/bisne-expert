// ─── Storage Driver ───────────────────────────────────────────────────────────
// Abstraction over Supabase Storage (production) and local filesystem (dev).
//
// Driver selection:
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set  →  SupabaseDriver
//   Otherwise                                      →  FsDriver (local dev)

export interface StorageDriver {
  readJSON(key: string): Promise<unknown | null>
  writeJSON(key: string, data: unknown): Promise<void>
  deleteJSON(key: string): Promise<void>
  listJSONKeys(prefix?: string): Promise<string[]>
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>
  deleteFile(key: string): Promise<void>
  listFileKeys(prefix?: string): Promise<string[]>
  readRaw(key: string): Promise<Buffer | null>
  readFile(key: string): Promise<Buffer | null>
}

let _driver: StorageDriver | null = null

export async function getDriver(): Promise<StorageDriver> {
  if (_driver) return _driver
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { SupabaseDriver } = await import('./storage.supabase')
    _driver = new SupabaseDriver()
  } else {
    const { FsDriver } = await import('./storage.fs')
    _driver = new FsDriver()
  }
  return _driver
}

export function isValidJsonKey(key: string): boolean {
  return /^[a-zA-Z0-9\-_/]+$/.test(key) && !key.includes('..')
}

export function isValidFileKey(key: string): boolean {
  return key.startsWith('uploads/') && !key.includes('..') && /^[a-zA-Z0-9\-_./]+$/.test(key)
}

// Maps a storage key → cache tags for Next.js revalidateTag()
export function getCacheTags(key: string): string[] {
  if (key === 'businesses') return ['businesses']
  if (key === 'config') return ['config']
  if (key === 'reports') return ['reports']
  if (key.startsWith('business/')) return ['businesses', `business:${key.slice(9)}`]
  if (key.startsWith('products/')) return ['products', `products:${key.slice(9)}`]
  return [key]
}
