// /api/biz-data — Owner-authenticated route for business mutations.
// Handles both new registration and owner updates.
// Invalidates cache after every successful mutation.

import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/storage'
import { invalidateKeys } from '@/lib/cache'

function isAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}
function isBizOwnerAuth(req: NextRequest, slug: string) {
  return req.cookies.get(`biz_session_${slug}`)?.value === 'authenticated'
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, updates, isNew, ownerPasswordHash, ownerCode } = body

  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 })

  const driver = await getDriver()
  const bizData: any = await driver.readJSON('businesses') ?? { businesses: [] }
  const businesses: any[] = bizData.businesses ?? []

  if (isNew) {
    if (businesses.find((b: any) => b.slug === slug)) {
      return NextResponse.json({ error: `El slug "${slug}" ya está en uso` }, { status: 409 })
    }
    const newBiz = {
      ...updates,
      slug,
      ownerPasswordHash,
      ownerCode,
      hidden: true,
      created_at: new Date().toISOString(),
    }
    await driver.writeJSON('businesses', { businesses: [...businesses, newBiz] })
    // Invalidate businesses cache
    invalidateKeys(['businesses'])
    return NextResponse.json({ ok: true, slug, code: ownerCode }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Edit: requires admin or owner
  if (!isAdminAuth(req) && !isBizOwnerAuth(req, slug)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const ownerAllowedFields = [
    'name', 'description', 'slogan', 'logo', 'image', 'unavailable',
    'categories', 'seo', 'coverImages',
  ]
  const adminAllowedFields = [
    ...ownerAllowedFields,
    'sponsored', 'premium', 'hidden', 'slug',
    'ownerPasswordHash', 'ownerCode',
  ]
  const allowed = isAdminAuth(req) ? adminAllowedFields : ownerAllowedFields

  const safeUpdates: any = {}
  for (const key of allowed) {
    if (key in updates) safeUpdates[key] = updates[key]
  }

  const updatedList = businesses.map((b: any) =>
    b.slug === slug ? { ...b, ...safeUpdates } : b
  )
  await driver.writeJSON('businesses', { businesses: updatedList })
  // Invalidate businesses + specific business detail
  invalidateKeys(['businesses', `business/${slug}`])
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
