import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MSYN Tools",
    short_name: "MSYN Tools",
    description: "Free browser-based PDF, image and utility tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#6d28d9",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
