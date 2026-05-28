import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['sql.js'],
  output: 'standalone',
};

export default nextConfig;
