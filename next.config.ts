// next.config.js (ou next.config.ts)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remplacez ceci :
  // experimental: {
  //   serverComponentsExternalPackages: ["nom-du-package"]
  // }
  
  // Par ceci :
  images: {
    domains: ['res.cloudinary.com'],
  },
  serverExternalPackages: ["nom-du-package"]
}

module.exports = nextConfig