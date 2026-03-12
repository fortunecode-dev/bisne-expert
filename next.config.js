/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Supabase Storage CDN images + local uploads
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Long-lived cache for all images
    minimumCacheTTL: 604800, // 7 days
  },
}
module.exports = nextConfig
