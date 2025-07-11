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
      {
        source: '/api/users/ai-chat',
        destination: 'http://localhost:8000/api/users/ai-chat/',
      },
      {
        source: '/api/users/ai-chat/',
        destination: 'http://localhost:8000/api/users/ai-chat/',
      },
    ];
  },
}

export default nextConfig
