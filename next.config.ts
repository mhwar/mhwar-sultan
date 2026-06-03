import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/mhwar-sultan',
  assetPrefix: '/mhwar-sultan',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
