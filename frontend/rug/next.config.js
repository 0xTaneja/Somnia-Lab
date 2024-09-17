/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' ws://172.20.27.76:5000 http://172.20.27.76:5000 https://api.openai.com",
              "frame-src 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
