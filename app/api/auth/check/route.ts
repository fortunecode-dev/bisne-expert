import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('admin_session')
  return NextResponse.json({ authenticated: session?.value === 'authenticated' }, { headers: { 'Cache-Control': 'no-store, no-cache' } })
}
