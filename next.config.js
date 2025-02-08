/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ["hkittdnfetrqpcvdueog.supabase.co"],
    },
    experimental: {
      serverActions: true,
    },
  }
  
  module.exports = nextConfig
  
  