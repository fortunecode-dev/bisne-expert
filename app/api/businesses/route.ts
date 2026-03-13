// /api/businesses — Lista todos los negocios leyendo {slug}/business.json por slug.
// Equivale a lo que hacía leer businesses.json, pero ahora lista el bucket.
// Sólo accesible para admin (session cookie).
// El cache del servidor (getCachedBusinesses) se usa en server components.
// Este endpoint es para el admin client-side que necesita la lista completa.

import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/storage'

function isAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

export async function GET(req: NextRequest) {
  if (!isAdminAuth(req))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const driver = await getDriver()
    const allKeys = await driver.listJSONKeys()
    // Filtrar solo las keys que matcheen {slug}/business
    const bizKeys = allKeys.filter(k => /^[a-z0-9-]+\/business$/.test(k))

    const results = await Promise.allSettled(
      bizKeys.map(k => driver.readJSON(k))
    )

    const businesses = results
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled' && !!r.value)
      .map(r => r.value)
      .sort((a: any, b: any) => {
        const ta = a.created_at ?? ''
        const tb = b.created_at ?? ''
        return ta < tb ? -1 : ta > tb ? 1 : 0
      })

    return NextResponse.json(businesses, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (e) {
    console.error('[api/businesses]', e)
    return NextResponse.json({ error: 'Error al listar negocios' }, { status: 500 })
  }
}
