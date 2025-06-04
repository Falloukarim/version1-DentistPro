import withPWA from '@ducanh2912/next-pwa';
import { version } from './package.json';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  generateBuildId: async () => version,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['@clerk/nextjs'],
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    allowedDevOrigins: ['be30-2001-4278-70-21e0-aca3-20c0-4321-13ac.ngrok-free.app']
  },
  images: {
    domains: ['res.cloudinary.com', 'img.clerk.com'],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  output: 'standalone',
};

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: true,
  dynamicStartUrl: false,
  cacheStartUrl: false,
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /\/icons\/.*\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'icons-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /^https?:\/\/.*\.(js|css|json)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
    ],
    additionalManifestEntries: [
      {
        url: '/offline',
        revision: version,
      },
    ],
  },
  manifest: {
    name: 'Mon Application',
    short_name: 'MonApp',
    description: 'Description de mon application',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
});

export default pwaConfig(nextConfig);