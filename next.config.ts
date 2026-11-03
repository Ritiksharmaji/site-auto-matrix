import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle (.next/standalone) for the production container.
  output: "standalone",
  // deploy/deploy.sh builds into .next-prod so a running dev server (.next) is untouched.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Make sure the Linux Prisma engine is copied into the standalone bundle.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;
