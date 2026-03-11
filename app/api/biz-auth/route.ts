import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDriver } from '@/lib/storage'

function hashPwd(pwd: string): string {
  const salt = process.env.BIZ_SALT || 'catalogos-salt-2025'
  return crypto.createHash('sha256').update(pwd + salt).digest('hex')
}

// POST /api/biz-auth  body: { slug, password }
// slug can be the business slug OR the ownerCode
export async function POST(req: NextRequest) {
  const { slug, password } = await req.json()
  if (!slug || !password) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const driver = await getDriver()
  const bizData: any = await driver.readJSON('businesses')
  const business = bizData?.businesses?.find(
    (b: any) => b.slug === slug || b.ownerCode === slug.toUpperCase()
  )
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
  if (!business.ownerPasswordHash) return NextResponse.json({ error: 'Este negocio no tiene contraseña configurada' }, { status: 403 })

  if (business.ownerPasswordHash !== hashPwd(password)) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, slug: business.slug })
  res.cookies.set(`biz_session_${business.slug}`, 'authenticated', {
    httpOnly: true, sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, path: '/',
  })
  return res
}
