/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Exclude /api/chat/* from proxying to Django
      {
        source: '/api/chat/:path*',
        destination: '/api/chat/:path*', // Let Next.js handle this route
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
}

export default nextConfig
