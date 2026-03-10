// ─── Filesystem Driver (local development) ───────────────────────────────────
// Reads/writes JSON under /data/ and images under /public/uploads/
// Mirrors exactly the structure of the project's data directory.

import fs from 'fs'
import path from 'path'
import type { StorageDriver } from './storage'

const DATA_DIR = path.join(process.cwd(), 'data')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

export class FsDriver implements StorageDriver {
  // ── JSON ──────────────────────────────────────────────────────────────────

  async readJSON(key: string): Promise<unknown | null> {
    const filePath = path.join(DATA_DIR, key + '.json')
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch {
      return null
    }
  }

  async writeJSON(key: string, data: unknown): Promise<void> {
    const filePath = path.join(DATA_DIR, key + '.json')
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  async deleteJSON(key: string): Promise<void> {
    const filePath = path.join(DATA_DIR, key + '.json')
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  async listJSONKeys(prefix?: string): Promise<string[]> {
    const keys: string[] = []
    this._walkDir(DATA_DIR, DATA_DIR, keys, '.json')
    const clean = keys.map(k => k.slice(0, -5)) // remove .json
    return prefix ? clean.filter(k => k.startsWith(prefix)) : clean
  }

  // ── Files ─────────────────────────────────────────────────────────────────

  async uploadFile(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    // key = "uploads/timestamp-name.jpg"
    const filePath = path.join(PUBLIC_DIR, key)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, buffer)
    return '/' + key // public URL: /uploads/filename.jpg
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(PUBLIC_DIR, key)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  async listFileKeys(prefix?: string): Promise<string[]> {
    const uploadsDir = path.join(PUBLIC_DIR, 'uploads')
    if (!fs.existsSync(uploadsDir)) return []
    const keys: string[] = []
    this._walkDir(uploadsDir, PUBLIC_DIR, keys)
    return prefix ? keys.filter(k => k.startsWith(prefix)) : keys
  }

  async readRaw(key: string): Promise<Buffer | null> {
    const filePath = path.join(DATA_DIR, key + '.json')
    try {
      return fs.readFileSync(filePath)
    } catch {
      return null
    }
  }

  async readFile(key: string): Promise<Buffer | null> {
    const filePath = path.join(PUBLIC_DIR, key)
    try {
      return fs.readFileSync(filePath)
    } catch {
      return null
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _walkDir(dir: string, base: string, results: string[], ext?: string): void {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        this._walkDir(full, base, results, ext)
      } else if (!ext || entry.name.endsWith(ext)) {
        results.push(path.relative(base, full).replace(/\\/g, '/'))
      }
    }
  }
}
