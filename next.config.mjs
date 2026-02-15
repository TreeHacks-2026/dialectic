/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dialectic/transcript-service'],
  // Removed serverExternalPackages - conflicts with transpilePackages
  // We're transpiling the package, so we don't need it as external
};

export default nextConfig;
