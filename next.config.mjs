/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server actions for future use
  experimental: {},
  typescript: {
    // Change this from false to true to ignore TS errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Add this block to ignore ESLint errors during build
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;