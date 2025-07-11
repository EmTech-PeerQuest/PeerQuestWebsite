/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Only proxy notifications-proxy and other direct-to-Django endpoints
      {
        source: '/api/notifications-proxy',
        destination: 'http://localhost:8000/api/notifications/', // Django backend
      },
      // Add other direct proxies if needed, but DO NOT proxy /api/applications/:id/approve or /reject
    ];
  },
};

module.exports = nextConfig;
