import { createSerwistRoute } from "@serwist/turbopack"

// Serves the compiled service worker at /serwist/sw.js (see SerwistProvider in
// providers.tsx). The revision versions precached entries so an old offline
// page isn't served after a deploy — Vercel exposes the commit SHA at build.
const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? crypto.randomUUID()

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "app/sw.ts",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  useNativeEsbuild: true,
})
