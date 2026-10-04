import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only for the Docker image. On a platform that builds Next.js itself (Vercel,
  // Netlify) this is ignored at best and confusing at worst, so it is opt-out.
  ...(process.env.VERCEL || process.env.NO_STANDALONE
    ? {}
    : { output: "standalone" as const }),
};

export default nextConfig;
