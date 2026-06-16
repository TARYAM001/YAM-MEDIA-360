// Même variable d'environnement que celle lue par lib/api.ts (NEXT_PUBLIC_API_URL).
// Doit être une simple origine, sans slash final ni chemin :
//   ✅ https://yam-backend.up.railway.app
//   ❌ https://yam-backend.up.railway.app/        (slash final = CSP restreint au chemin "/")
//   ❌ https://yam-backend.up.railway.app/api      (idem, jamais de chemin ici)
// À définir dans Vercel → Project Settings → Environment Variables.
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'clsx', 'date-fns'],
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options',        value: 'DENY'                            },
        { key: 'X-Content-Type-Options',  value: 'nosniff'                         },
        { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection',        value: '1; mode=block'                   },
        { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
        // ⚠️ connect-src ajouté : sans cette ligne, le CSP retombe sur
        // default-src 'self' et bloque TOUS les fetch() vers le backend
        // (Railway), même si NEXT_PUBLIC_API_URL est correctement configuré.
        { key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${BACKEND_ORIGIN};` },
      ],
    },
    {
      source: '/api/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
    {
      source: '/_next/static/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/fonts/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ],
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};
module.exports = nextConfig;

