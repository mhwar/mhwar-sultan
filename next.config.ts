import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/mhwar-sultan',
  assetPrefix: '/mhwar-sultan',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/mhwar-sultan',
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
