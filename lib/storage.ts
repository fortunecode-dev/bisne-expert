// ─── Storage Driver (v10) ──────────────────────────────────────────────────────
//
// Nueva estructura de buckets en Supabase:
//
//   "data"   (privado)
//     {slug}/business.json    ← datos del negocio + campos de dueño
//     {slug}/products.json    ← productos del negocio
//     config.json             ← config global (raíz)
//     reports.json            ← reportes (raíz)
//
//   "uploads" (público, CDN)
//     {slug}/{timestamp}-{name}.ext   ← imágenes por negocio
//
//   "backup"  (privado)
//     {YYYY-MM-DD}_{HH-MM}_{slug}.zip ← backup automático al registrar
//
// Listar todos los negocios = listar keys que matcheen ^[slug]/business$
//
// Selección de driver:
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  →  SupabaseDriver
//   En otro caso                               →  FsDriver (dev local)

export interface StorageDriver {
  readJSON(key: string): Promise<unknown | null>
  writeJSON(key: string, data: unknown): Promise<void>
  deleteJSON(key: string): Promise<void>
  listJSONKeys(prefix?: string): Promise<string[]>
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>
  deleteFile(key: string): Promise<void>
  listFileKeys(prefix?: string): Promise<string[]>
  readRaw(key: string): Promise<Buffer | null>   // para backup
  readFile(key: string): Promise<Buffer | null>  // para backup
  saveBackup(filename: string, buffer: Buffer): Promise<void>
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
  return !key.includes('..') && /^[a-zA-Z0-9\-_./]+$/.test(key)
}

// ─── Helpers de keys ─────────────────────────────────────────────────────────
// Un único lugar donde se construyen todos los paths — nunca strings sueltos.

export const storageKeys = {
  business: (slug: string) => `${slug}/business`,
  products: (slug: string) => `${slug}/products`,
  config:   ()             => 'config',
  reports:  ()             => 'reports',
}

// ─── Cache tags ───────────────────────────────────────────────────────────────
// Mapea un storage key → tags de Next.js para revalidateTag()

export function getCacheTags(key: string): string[] {
  if (key === 'config')  return ['config']
  if (key === 'reports') return ['reports']
  const mBiz  = key.match(/^([a-z0-9-]+)\/business$/)
  const mProd = key.match(/^([a-z0-9-]+)\/products$/)
  if (mBiz)  return ['businesses', `business:${mBiz[1]}`]
  if (mProd) return ['products',   `products:${mProd[1]}`]
  return [key]
}
