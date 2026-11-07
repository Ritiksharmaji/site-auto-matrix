/**
 * oneKampus publishes static files, so the site is exported to out/ at build time.
 * Server-only features (API routes, server actions, middleware, dynamic rendering)
 * are not available; use the oneKampus APIs for forms.
 */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
