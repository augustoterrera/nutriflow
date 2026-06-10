import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Tauri no tiene servidor de optimización de imágenes
  },
}

export default nextConfig