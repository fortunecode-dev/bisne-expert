import crypto from 'crypto'

const SALT = process.env.BIZ_SALT || 'catalogos-salt-2025'

export function makeToken(slug: string): string {
  const payload = Buffer.from(`${slug}:${Date.now()}`).toString('base64url')
  const sig = crypto.createHmac('sha256', SALT).update(payload).digest('hex').slice(0, 16)
  return `${payload}.${sig}`
}

export function verifyToken(token: string): string | null {
  try {
    const [payload, sig] = token.split('.')
    const expected = crypto.createHmac('sha256', SALT).update(payload).digest('hex').slice(0, 16)
    if (sig !== expected) return null
    const decoded = Buffer.from(payload, 'base64url').toString()
    const [slug, ts] = decoded.split(':')
    if (Date.now() - parseInt(ts) > 30 * 24 * 60 * 60 * 1000) return null
    return slug
  } catch { return null }
}
