import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ authed: false })
  // Admin session bypasses owner auth
  const isAdmin = req.cookies.get('admin_session')?.value === 'authenticated'
  const isOwner = req.cookies.get(`biz_session_${slug}`)?.value === 'authenticated'
  return NextResponse.json({ authed: isAdmin || isOwner, isAdmin })
}
