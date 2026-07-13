import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SetTrackr",
    short_name: "SetTrackr",
    description: "Track your gym workouts",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      // 512px is required for the Android install prompt + splash screen.
      // Full-square background (no rounded corners) so it's maskable-safe.
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
