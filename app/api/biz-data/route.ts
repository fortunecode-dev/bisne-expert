// /api/biz-data — Owner-authenticated route to update their own business entry
// in businesses.json (owners can't write businesses.json directly - admin-only).
// Also handles new business registration (no auth needed for POST with isNew).

import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/storage'

function isAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}
function isBizOwnerAuth(req: NextRequest, slug: string) {
  return req.cookies.get(`biz_session_${slug}`)?.value === 'authenticated'
}

// POST /api/biz-data
// body: { slug, updates, isNew?, ownerPasswordHash?, ownerCode? }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, updates, isNew, ownerPasswordHash, ownerCode } = body

  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 })

  const driver = await getDriver()
  const bizData: any = await driver.readJSON('businesses') ?? { businesses: [] }
  const businesses: any[] = bizData.businesses ?? []

  if (isNew) {
    // Registration: slug must not exist
    if (businesses.find((b: any) => b.slug === slug)) {
      return NextResponse.json({ error: `El slug "${slug}" ya está en uso` }, { status: 409 })
    }
    const newBiz = {
      ...updates,
      slug,
      ownerPasswordHash,
      ownerCode,
      hidden: true,              // pending admin approval
      created_at: new Date().toISOString(),
    }
    await driver.writeJSON('businesses', { businesses: [...businesses, newBiz] })
    return NextResponse.json({ ok: true, slug, code: ownerCode })
  }

  // Edit: requires admin or owner
  if (!isAdminAuth(req) && !isBizOwnerAuth(req, slug)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Owner-safe fields (owners cannot change tier/slug/id)
  const ownerAllowedFields = [
    'name', 'description', 'slogan', 'logo', 'image', 'unavailable',
    'categories', 'seo',
  ]
  const adminAllowedFields = [...ownerAllowedFields, 'sponsored', 'premium', 'hidden', 'slug', 'coverImages', 'ownerPasswordHash', 'ownerCode']
  const allowed = isAdminAuth(req) ? adminAllowedFields : ownerAllowedFields

  const safeUpdates: any = {}
  for (const key of allowed) {
    if (key in updates) safeUpdates[key] = updates[key]
  }

  const updatedList = businesses.map((b: any) =>
    b.slug === slug ? { ...b, ...safeUpdates } : b
  )
  await driver.writeJSON('businesses', { businesses: updatedList })
  return NextResponse.json({ ok: true })
}
