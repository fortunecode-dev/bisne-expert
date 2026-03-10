import { headers } from 'next/headers'
import { fetchBusinesses, fetchBusinessDetail, fetchConfig } from '@/lib/api'
import { BusinessDetail } from '@/types'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

function getBaseUrl(): string {
  const h = headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export default async function HomePage() {
  const base = getBaseUrl()
  const allBiz = await fetchBusinesses(base)
  const visible = allBiz.filter(b => !b.hidden)

  const detailEntries = await Promise.allSettled(
    visible.map(b => fetchBusinessDetail(b.slug, base).then(d => [b.slug, d] as const))
  )
  const details: Record<string, BusinessDetail> = {}
  detailEntries.forEach(r => {
    if (r.status === 'fulfilled') details[r.value[0]] = r.value[1]
  })

  const config = await fetchConfig(base)

  return <HomeClient initialBusinesses={visible} initialDetails={details} initialConfig={config} />
}
