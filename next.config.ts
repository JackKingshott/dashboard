import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['googleapis'],
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
