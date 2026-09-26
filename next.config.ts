import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// Extract hostname from Supabase URL (e.g. "xxxx.supabase.co")
const supabaseHostname = SUPABASE_URL
  ? new URL(SUPABASE_URL).hostname
  : '*.supabase.co';

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Referrer policy — send origin when navigating to external HTTPS
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions — disable unnecessary browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // HSTS — conservative initial policy; extend max-age after 30 days of stability
  // Note: preload and includeSubDomains omitted until all subdomains are confirmed HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=86400',  // 24h initially; increase to 31536000 after validation
  },
  // Content-Security-Policy
  // 'unsafe-inline' is required by Next.js inline hydration scripts.
  // 'unsafe-eval' is added in development only — React dev mode uses eval()
  //   for error overlays and hot-reload source reconstruction.
  //   Production builds never need eval().
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      process.env.NODE_ENV === 'development'
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' data: blob: https://${supabaseHostname} https://storage.googleapis.com`,
      `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname}`,
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  images: {
    // When localPatterns is defined Next.js enforces the allowlist for ALL local images.
    localPatterns: [
      { pathname: '/logo.jpg',              search: '' },
      { pathname: '/images/products/**',    search: '' },
      { pathname: '/og-image.jpg',          search: '' },
      { pathname: '/apple-touch-icon.png',  search: '' },
      { pathname: '/icon-192.png',          search: '' },
      { pathname: '/icon-512.png',          search: '' },
    ],
    // When using Supabase Storage, allow the project's storage hostname
    remotePatterns: SUPABASE_URL
      ? [{ protocol: 'https', hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
      : [],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Redirect www → non-www (canonical domain)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.lualekids.shop' }],
        destination: 'https://lualekids.shop/:path*',
        permanent: true,   // 308 permanent
      },
    ];
  },
};

export default nextConfig;
