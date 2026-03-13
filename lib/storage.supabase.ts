// ─── Supabase Storage Driver (v10) ────────────────────────────────────────────
//
// Buckets:
//   "data"    privado  — {slug}/business.json  {slug}/products.json  config.json  reports.json
//   "uploads" público  — {slug}/{filename}.ext
//   "backup"  privado  — {date}_{slug}.zip
//
// Vars requeridas: SUPABASE_URL  SUPABASE_SERVICE_ROLE_KEY

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { StorageDriver } from './storage'

const DATA_BUCKET    = 'data'
const UPLOADS_BUCKET = 'uploads'
const BACKUP_BUCKET  = 'backup'

function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${key}` } },
  })
}

export class SupabaseDriver implements StorageDriver {
  private sb: SupabaseClient
  constructor() { this.sb = getClient() }

  // ── JSON ──────────────────────────────────────────────────────────────────

  async readJSON(key: string): Promise<unknown | null> {
    try {
      const { data, error } = await this.sb.storage
        .from(DATA_BUCKET).download(`${key}.json`)
      if (error || !data) return null
      return JSON.parse(await data.text())
    } catch { return null }
  }

  async writeJSON(key: string, data: unknown): Promise<void> {
    const { error } = await this.sb.storage.from(DATA_BUCKET).upload(
      `${key}.json`,
      JSON.stringify(data, null, 2),
      { contentType: 'application/json', upsert: true, cacheControl: '0' }
    )
    if (error) throw new Error(`writeJSON(${key}) failed: ${error.message}`)
  }

  async deleteJSON(key: string): Promise<void> {
    const { error } = await this.sb.storage.from(DATA_BUCKET).remove([`${key}.json`])
    if (error && !error.message.toLowerCase().includes('not found'))
      throw new Error(`deleteJSON(${key}) failed: ${error.message}`)
  }

  async listJSONKeys(prefix?: string): Promise<string[]> {
    const all = await this._listRecursive(DATA_BUCKET, prefix ?? '')
    return all.filter(p => p.endsWith('.json')).map(p => p.slice(0, -5))
  }

  // ── Imágenes — key: "{slug}/{filename}" ───────────────────────────────────

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
    const { error } = await this.sb.storage.from(UPLOADS_BUCKET).upload(key, ab, {
      contentType, upsert: false, cacheControl: '604800',
    })
    if (error) throw new Error(`uploadFile(${key}) failed: ${error.message}`)
    const { data } = this.sb.storage.from(UPLOADS_BUCKET).getPublicUrl(key)
    return data.publicUrl
  }

  async deleteFile(key: string): Promise<void> {
    const { error } = await this.sb.storage.from(UPLOADS_BUCKET).remove([key])
    if (error && !error.message.toLowerCase().includes('not found'))
      throw new Error(`deleteFile(${key}) failed: ${error.message}`)
  }

  async listFileKeys(prefix?: string): Promise<string[]> {
    return this._listRecursive(UPLOADS_BUCKET, prefix ?? '')
  }

  // ── Backup ────────────────────────────────────────────────────────────────

  async saveBackup(filename: string, buffer: Buffer): Promise<void> {
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
    const { error } = await this.sb.storage.from(BACKUP_BUCKET).upload(filename, ab, {
      contentType: 'application/zip', upsert: true, cacheControl: '0',
    })
    if (error) throw new Error(`saveBackup(${filename}) failed: ${error.message}`)
  }

  // ── Lecturas raw (para /api/backup download) ──────────────────────────────

  async readRaw(key: string): Promise<Buffer | null> {
    try {
      const { data, error } = await this.sb.storage.from(DATA_BUCKET).download(`${key}.json`)
      if (error || !data) return null
      return Buffer.from(await data.arrayBuffer())
    } catch { return null }
  }

  async readFile(key: string): Promise<Buffer | null> {
    try {
      const { data, error } = await this.sb.storage.from(UPLOADS_BUCKET).download(key)
      if (error || !data) return null
      return Buffer.from(await data.arrayBuffer())
    } catch { return null }
  }

  // ── Helpers internos ──────────────────────────────────────────────────────

  private async _listRecursive(bucket: string, prefix: string): Promise<string[]> {
    const results: string[] = []
    await this._listDir(bucket, prefix, results)
    return results
  }

  private async _listDir(bucket: string, path: string, acc: string[]): Promise<void> {
    const { data, error } = await this.sb.storage.from(bucket).list(
      path || undefined,
      { limit: 200, sortBy: { column: 'name', order: 'asc' } }
    )
    if (error || !data) return
    for (const item of data) {
      const full = path ? `${path}/${item.name}` : item.name
      if (item.metadata === null) {
        await this._listDir(bucket, full, acc)  // carpeta → recursivo
      } else {
        acc.push(full)
      }
    }
  }
}
