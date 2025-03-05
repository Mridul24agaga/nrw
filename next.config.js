/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb', // Increase the limit to 8MB
    },
  },
  images: {
    domains: [
      "localhost",
      "localhost:54321",
      "localhost:3000",
      // Add your Supabase project domain
      "hkittdnfetrqpcvdueog.supabase.co",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "**",
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig

