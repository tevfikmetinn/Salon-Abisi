import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static HTML export — herhangi bir static hosting'e deploy edilebilir
  // (Cloudflare Pages, Netlify, GitHub Pages, vb.)
  // Build çıktısı: formkocu/out/ klasörü
  output: 'export',

  // Static export ile image optimization devre dışı (server gerektirir)
  images: {
    unoptimized: true,
  },

  // Trailing slash: bazı static host'lar için iyi pratik
  trailingSlash: true,
}

export default nextConfig
