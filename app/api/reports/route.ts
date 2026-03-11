// /api/reports — Save business reports (public POST) and list them (admin GET)
import { NextRequest, NextResponse } from 'next/server'
import { getDriver } from '@/lib/storage'

function isAdminAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === 'authenticated'
}

// GET /api/reports  — admin only
export async function GET(req: NextRequest) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const driver = await getDriver()
  const data = await driver.readJSON('reports') ?? { reports: [] }
  return NextResponse.json(data)
}

// POST /api/reports  — public
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, name, email, reason, description } = body
  if (!slug || !name || !reason) {
    return NextResponse.json({ error: 'slug, name y reason son requeridos' }, { status: 400 })
  }
  const driver = await getDriver()
  const data: any = await driver.readJSON('reports') ?? { reports: [] }
  const report = {
    id: `r_${Date.now()}`,
    slug, name, email: email ?? '', reason, description: description ?? '',
    created_at: new Date().toISOString(),
    reviewed: false,
  }
  data.reports = [report, ...(data.reports ?? [])]
  await driver.writeJSON('reports', data)
  return NextResponse.json({ ok: true })
}

// PATCH /api/reports  — admin: mark reviewed
export async function PATCH(req: NextRequest) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await req.json()
  const driver = await getDriver()
  const data: any = await driver.readJSON('reports') ?? { reports: [] }
  data.reports = data.reports.map((r: any) => r.id === id ? { ...r, reviewed: true } : r)
  await driver.writeJSON('reports', data)
  return NextResponse.json({ ok: true })
}
