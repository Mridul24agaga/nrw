/** @type {import('next').NextConfig} */
const nextConfig = {
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

