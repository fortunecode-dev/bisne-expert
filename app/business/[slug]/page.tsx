import { redirect } from 'next/navigation'

// Legacy redirect: /business/slug → /slug
export default function LegacyBusinessPage({ params }: { params: { slug: string } }) {
  redirect(`/${params.slug}`)
}
