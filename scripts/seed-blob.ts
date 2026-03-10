// ─── scripts/seed-blob.ts ─────────────────────────────────────────────────────
// Seeds Vercel Blob with the local data/ JSON files on first deploy.
// Run once after connecting the Blob Store:
//   npx tsx scripts/seed-blob.ts
//
// This script uploads every JSON file under data/ to the blob store,
// using the same key structure as the storage driver.

import fs from 'fs'
import path from 'path'
import { put, list } from '@vercel/blob'

const DATA_DIR = path.join(process.cwd(), 'data')

function walkDir(dir: string, base: string, results: string[]): void {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkDir(full, base, results)
    else if (entry.name.endsWith('.json')) results.push(path.relative(base, full).replace(/\\/g, '/'))
  }
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('❌ BLOB_READ_WRITE_TOKEN not set. Add it to .env.local')
    process.exit(1)
  }

  const files: string[] = []
  walkDir(DATA_DIR, DATA_DIR, files)

  if (files.length === 0) {
    console.log('⚠️  No JSON files found in data/')
    return
  }

  console.log(`📦 Uploading ${files.length} file(s) to Vercel Blob...\n`)

  for (const file of files) {
    // file: "businesses.json", "business/slug.json", "products/slug.json", "config.json"
    // blob pathname: "data/businesses.json", etc.
    const pathname = `data/${file}`
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8')

    // Check if already exists
    const { blobs } = await list({ prefix: pathname })
    const exists = blobs.some(b => b.pathname === pathname)
    if (exists) {
      console.log(`  ⏭  ${pathname} (already exists, skipping)`)
      continue
    }

    await put(pathname, content, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })
    console.log(`  ✓  ${pathname}`)
  }

  console.log('\n✅ Seed complete!')
  console.log('   Note: images need to be re-uploaded via the admin panel.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
