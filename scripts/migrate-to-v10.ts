// ─── scripts/migrate-to-v10.ts ────────────────────────────────────────────────
// Migra la estructura antigua (businesses.json + business/{slug}.json + products/{slug}.json)
// a la nueva estructura v10 ({slug}/business.json + {slug}/products.json).
//
// Correr UNA SOLA VEZ después de desplegar v10:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-to-v10.ts

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!url || !key) { console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const sb = createClient(url, key, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${key}` } },
})

async function readJSON(path: string): Promise<any> {
  const { data, error } = await sb.storage.from('data').download(path)
  if (error || !data) return null
  return JSON.parse(await data.text())
}

async function writeJSON(path: string, data: any): Promise<void> {
  const { error } = await sb.storage.from('data').upload(
    path, JSON.stringify(data, null, 2),
    { contentType: 'application/json', upsert: true, cacheControl: '0' }
  )
  if (error) throw new Error(`writeJSON(${path}): ${error.message}`)
}

async function main() {
  console.log('🔄 Iniciando migración a estructura v10...\n')

  // 1. Leer businesses.json central
  const bizData: any = await readJSON('businesses.json')
  if (!bizData?.businesses?.length) {
    console.log('⚠️  No se encontró businesses.json o está vacío. Nada que migrar.')
    return
  }
  console.log(`📦 ${bizData.businesses.length} negocios encontrados en businesses.json`)

  for (const biz of bizData.businesses) {
    const slug: string = biz.slug
    if (!slug) { console.log('  ⚠️  Negocio sin slug, saltando'); continue }

    // 2. Leer detail y products antiguos
    const detail   = await readJSON(`business/${slug}.json`) ?? {}
    const prodData = await readJSON(`products/${slug}.json`) ?? { products: [] }

    // 3. Fusionar business + detail en {slug}/business.json
    const merged = { ...biz, ...detail, slug }
    await writeJSON(`${slug}/business.json`, merged)
    console.log(`  ✓ ${slug}/business.json`)

    // 4. Copiar products
    await writeJSON(`${slug}/products.json`, prodData)
    console.log(`  ✓ ${slug}/products.json`)
  }

  console.log('\n✅ Migración completada.')
  console.log('   Puedes eliminar manualmente businesses.json, business/ y products/ del bucket "data" cuando confirmes que todo funciona.')
}

main().catch(e => { console.error(e); process.exit(1) })
