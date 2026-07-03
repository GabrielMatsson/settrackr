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
    ],
  }
}
