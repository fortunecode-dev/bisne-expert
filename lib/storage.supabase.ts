// ─── Supabase Storage Driver ──────────────────────────────────────────────────
// JSON "files" → stored in Supabase Storage bucket "data" as {key}.json
// Images       → stored in Supabase Storage bucket "uploads"
//
// Bucket setup (do once in Supabase dashboard or via migration):
//   "data"    — private bucket, accessed via service role key
//   "uploads" — public bucket, files served via Supabase CDN
//
// Required env vars:
//   SUPABASE_URL              — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service role key (never exposed to client)
//   NEXT_PUBLIC_SUPABASE_URL  — same URL, for client-side image URLs

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { StorageDriver } from './storage'

const DATA_BUCKET = 'data'
const UPLOADS_BUCKET = 'uploads'

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

  constructor() {
    this.sb = getClient()
  }

  // ── JSON ──────────────────────────────────────────────────────────────────

  async readJSON(key: string): Promise<unknown | null> {
    try {
      const path = `${key}.json`
      const { data, error } = await this.sb.storage
        .from(DATA_BUCKET)
        .download(path)
      if (error || !data) return null
      const text = await data.text()
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  async writeJSON(key: string, data: unknown): Promise<void> {
    const path = `${key}.json`
    const content = JSON.stringify(data, null, 2)
    // Pass as string — Supabase accepts string | ArrayBuffer | ArrayBufferView | Blob | File
    const { error } = await this.sb.storage
      .from(DATA_BUCKET)
      .upload(path, content, {
        contentType: 'application/json',
        upsert: true,
        cacheControl: '0',
      })
    if (error) throw new Error(`writeJSON(${key}) failed: ${error.message}`)
  }

  async deleteJSON(key: string): Promise<void> {
    const path = `${key}.json`
    const { error } = await this.sb.storage.from(DATA_BUCKET).remove([path])
    if (error && !error.message.includes('not found')) {
      throw new Error(`deleteJSON(${key}) failed: ${error.message}`)
    }
  }

  async listJSONKeys(prefix?: string): Promise<string[]> {
    // Supabase list() is not recursive — we handle nested paths by listing subdirs
    const results = await this._listRecursive(DATA_BUCKET, prefix ?? '')
    return results
      .filter(p => p.endsWith('.json'))
      .map(p => p.slice(0, -5)) // strip .json
  }

  // ── Files ─────────────────────────────────────────────────────────────────

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    // key = "uploads/timestamp-name.jpg"
    // Strip leading "uploads/" — bucket is already "uploads"
    const path = key.startsWith('uploads/') ? key.slice('uploads/'.length) : key
    // Copy into a plain ArrayBuffer to satisfy TypeScript's strict Blob types
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer

    const { data, error } = await this.sb.storage
      .from(UPLOADS_BUCKET)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: false,
        cacheControl: '604800', // 7 days CDN cache on images
      })
    if (error) throw new Error(`uploadFile(${key}) failed: ${error.message}`)

    // Return public URL (Supabase Storage CDN)
    const { data: urlData } = this.sb.storage.from(UPLOADS_BUCKET).getPublicUrl(path)
    return urlData.publicUrl
  }

  async deleteFile(key: string): Promise<void> {
    const path = key.startsWith('uploads/') ? key.slice('uploads/'.length) : key
    const { error } = await this.sb.storage.from(UPLOADS_BUCKET).remove([path])
    if (error && !error.message.includes('not found')) {
      throw new Error(`deleteFile(${key}) failed: ${error.message}`)
    }
  }

  async listFileKeys(prefix?: string): Promise<string[]> {
    const stripPrefix = 'uploads/'
    const innerPrefix = prefix?.startsWith(stripPrefix) ? prefix.slice(stripPrefix.length) : (prefix ?? '')
    const paths = await this._listRecursive(UPLOADS_BUCKET, innerPrefix)
    return paths.map(p => `uploads/${p}`)
  }

  async readRaw(key: string): Promise<Buffer | null> {
    try {
      const path = `${key}.json`
      const { data, error } = await this.sb.storage.from(DATA_BUCKET).download(path)
      if (error || !data) return null
      return Buffer.from(await data.arrayBuffer())
    } catch {
      return null
    }
  }

  async readFile(key: string): Promise<Buffer | null> {
    try {
      const path = key.startsWith('uploads/') ? key.slice('uploads/'.length) : key
      const { data, error } = await this.sb.storage.from(UPLOADS_BUCKET).download(path)
      if (error || !data) return null
      return Buffer.from(await data.arrayBuffer())
    } catch {
      return null
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async _listRecursive(bucket: string, prefix: string): Promise<string[]> {
    const results: string[] = []
    await this._listDir(bucket, prefix, results)
    return results
  }

  private async _listDir(bucket: string, path: string, acc: string[]): Promise<void> {
    const { data, error } = await this.sb.storage.from(bucket).list(path || undefined, {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error || !data) return

    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name
      if (item.metadata === null) {
        // It's a "folder" — recurse
        await this._listDir(bucket, fullPath, acc)
      } else {
        acc.push(fullPath)
      }
    }
  }
}
