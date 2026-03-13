// ─── Vercel Blob Driver (production) ─────────────────────────────────────────
// JSON files stored as blobs with pathname: "data/{key}.json"
// Image files stored as blobs with pathname: "uploads/{filename}"
//
// Blob URL structure:
//   JSON:  https://{store}.blob.vercel-storage.com/data/businesses.json
//   Image: https://{store}.blob.vercel-storage.com/uploads/1234-name.jpg
//
// Public image URLs are returned directly from Vercel Blob (CDN).

import { put, del, list, head, type PutBlobResult } from '@vercel/blob'
import type { StorageDriver } from './storage'

const JSON_PREFIX = 'data/'
const FILE_PREFIX = 'uploads/'

export class BlobDriver implements StorageDriver {
  // ── JSON ──────────────────────────────────────────────────────────────────

  async readJSON(key: string): Promise<unknown | null> {
    try {
      // Blob pathname: "data/businesses.json", "data/business/slug.json", etc.
      const pathname = JSON_PREFIX + key + '.json'
      // list() to find the blob URL (put() returns URL, but we need to look it up)
      const { blobs } = await list({ prefix: pathname })
      const blob = blobs.find(b => b.pathname === pathname)
      if (!blob) return null
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  }

  async writeJSON(key: string, data: unknown): Promise<void> {
    const pathname = JSON_PREFIX + key + '.json'
    const content = JSON.stringify(data, null, 2)
    await put(pathname, content, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // deterministic pathname
    })
  }

  async deleteJSON(key: string): Promise<void> {
    try {
      const pathname = JSON_PREFIX + key + '.json'
      const { blobs } = await list({ prefix: pathname })
      const blob = blobs.find(b => b.pathname === pathname)
      if (blob) await del(blob.url)
    } catch {
      // Ignore not-found errors
    }
  }

  async listJSONKeys(prefix?: string): Promise<string[]> {
    const blobPrefix = JSON_PREFIX + (prefix ?? '')
    const { blobs } = await list({ prefix: blobPrefix })
    return blobs
      .map(b => {
        // pathname: "data/businesses.json" → key: "businesses"
        const key = b.pathname.slice(JSON_PREFIX.length)
        return key.endsWith('.json') ? key.slice(0, -5) : key
      })
  }

  // ── Files ─────────────────────────────────────────────────────────────────

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    // key = "uploads/timestamp-name.jpg"
    // Store directly at pathname "uploads/filename.jpg" in blob
    const pathname = key // already has "uploads/" prefix
    const result: PutBlobResult = await put(pathname, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    })
    // Return the Vercel Blob CDN URL (e.g. https://xxx.blob.vercel-storage.com/uploads/file.jpg)
    return result.url
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const { blobs } = await list({ prefix: key })
      const blob = blobs.find(b => b.pathname === key)
      if (blob) await del(blob.url)
    } catch {}
  }

  async listFileKeys(prefix?: string): Promise<string[]> {
    const blobPrefix = prefix ?? FILE_PREFIX
    const { blobs } = await list({ prefix: blobPrefix })
    return blobs.map(b => b.pathname)
  }

  async readRaw(key: string): Promise<Buffer | null> {
    try {
      const pathname = JSON_PREFIX + key + '.json'
      const { blobs } = await list({ prefix: pathname })
      const blob = blobs.find(b => b.pathname === pathname)
      if (!blob) return null
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    } catch {
      return null
    }
  }

  async readFile(key: string): Promise<Buffer | null> {
    try {
      const { blobs } = await list({ prefix: key })
      const blob = blobs.find(b => b.pathname === key)
      if (!blob) return null
      const res = await fetch(blob.url, { cache: 'no-store' })
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    } catch {
      return null
    }
  }

  // BlobDriver is a legacy driver — backups not supported, no-op to satisfy interface
  async saveBackup(_filename: string, _buffer: Buffer): Promise<void> {
    console.warn('[BlobDriver] saveBackup not implemented — use SupabaseDriver for backup support')
  }
}
