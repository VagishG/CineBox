import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  // Web App Manifest enables install and standalone display for PWA-like behavior [^1][^3]
  return {
    name: "CineBox",
    short_name: "CineBox",
    description: "TV-friendly movie & series browser with keyboard navigation.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#06b6d4",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
