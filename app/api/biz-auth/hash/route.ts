import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function hashPwd(pwd: string): string {
  const salt = process.env.BIZ_SALT || 'catalogos-salt-2025'
  return crypto.createHash('sha256').update(pwd + salt).digest('hex')
}

// POST /api/biz-auth/hash — returns { hash, code } — used during registration
// No auth needed (password is hashed before storing)
export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (!password || password.length < 6)
    return NextResponse.json({ error: 'Contraseña demasiado corta' }, { status: 400 })

  return NextResponse.json({
    hash: hashPwd(password),
    code: generateCode(),
  })
}
