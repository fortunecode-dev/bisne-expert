// ─── Filesystem Driver (v10 — dev local) ─────────────────────────────────────
// Espeja la nueva estructura por slug:
//   data/{slug}/business.json
//   data/{slug}/products.json
//   data/config.json
//   data/reports.json
//   public/uploads/{slug}/{filename}.ext
//   backups/{date}_{slug}.zip  (carpeta local)

import fs from 'fs'
import path from 'path'
import type { StorageDriver } from './storage'

const DATA_DIR    = path.join(process.cwd(), 'data')
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')
const BACKUP_DIR  = path.join(process.cwd(), 'backups')

export class FsDriver implements StorageDriver {

  // ── JSON ──────────────────────────────────────────────────────────────────

  async readJSON(key: string): Promise<unknown | null> {
    try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${key}.json`), 'utf-8')) }
    catch { return null }
  }

  async writeJSON(key: string, data: unknown): Promise<void> {
    const file = path.join(DATA_DIR, `${key}.json`)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
  }

  async deleteJSON(key: string): Promise<void> {
    const file = path.join(DATA_DIR, `${key}.json`)
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }

  async listJSONKeys(prefix?: string): Promise<string[]> {
    const results: string[] = []
    this._walk(DATA_DIR, DATA_DIR, results, '.json')
    const clean = results.map(k => k.slice(0, -5))
    return prefix ? clean.filter(k => k.startsWith(prefix)) : clean
  }

  // ── Imágenes — key: "{slug}/{filename}" ───────────────────────────────────

  async uploadFile(key: string, buffer: Buffer, _ct: string): Promise<string> {
    const file = path.join(UPLOADS_DIR, key)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, buffer)
    return `/uploads/${key}`
  }

  async deleteFile(key: string): Promise<void> {
    const file = path.join(UPLOADS_DIR, key)
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }

  async listFileKeys(prefix?: string): Promise<string[]> {
    if (!fs.existsSync(UPLOADS_DIR)) return []
    const results: string[] = []
    this._walk(UPLOADS_DIR, UPLOADS_DIR, results)
    return prefix ? results.filter(k => k.startsWith(prefix)) : results
  }

  // ── Backup ────────────────────────────────────────────────────────────────

  async saveBackup(filename: string, buffer: Buffer): Promise<void> {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    fs.writeFileSync(path.join(BACKUP_DIR, filename), buffer)
  }

  // ── Lecturas raw ──────────────────────────────────────────────────────────

  async readRaw(key: string): Promise<Buffer | null> {
    try { return fs.readFileSync(path.join(DATA_DIR, `${key}.json`)) }
    catch { return null }
  }

  async readFile(key: string): Promise<Buffer | null> {
    try { return fs.readFileSync(path.join(UPLOADS_DIR, key)) }
    catch { return null }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _walk(dir: string, base: string, out: string[], ext?: string): void {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) this._walk(full, base, out, ext)
      else if (!ext || entry.name.endsWith(ext))
        out.push(path.relative(base, full).replace(/\\/g, '/'))
    }
  }
}
