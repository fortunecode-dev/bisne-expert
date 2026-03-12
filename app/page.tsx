import { getCachedBusinesses, getCachedBusinessDetail, getCachedConfig } from '@/lib/cache'
import { BusinessDetail } from '@/types'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const allBiz = await getCachedBusinesses()
  const visible = allBiz.filter(b => !b.hidden)

  // Fetch details in parallel — each is independently cached
  const detailEntries = await Promise.allSettled(
    visible.map(b => getCachedBusinessDetail(b.slug).then(d => [b.slug, d] as const))
  )
  const details: Record<string, BusinessDetail> = {}
  detailEntries.forEach(r => {
    if (r.status === 'fulfilled') details[r.value[0]] = r.value[1]
  })

  const config = await getCachedConfig()

  return <HomeClient initialBusinesses={visible} initialDetails={details} initialConfig={config} />
}
