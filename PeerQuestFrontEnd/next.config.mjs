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
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/chat/:path*',
        destination: '/api/chat/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
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
