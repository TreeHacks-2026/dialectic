/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dialectic/transcript-service'],
  experimental: {
    // Enable workspace package resolution
    serverComponentsExternalPackages: ['@dialectic/transcript-service'],
  },
};

export default nextConfig;
