import type { NextConfig } from 'next'

// GitHub Pages URL'i `username.github.io/repo-name` formundadır.
// basePath ile asset/route'lar bu prefix altında çalışır.
// Cloudflare Pages root'tan serve eder → basePath yok.
//
// CI ortamında GITHUB_PAGES=true env var set edilir.
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const repoName = 'Salon-Abisi'

const nextConfig: NextConfig = {
  // Static HTML export — herhangi bir static hosting'e deploy edilebilir.
  // Build çıktısı: formkocu/out/ klasörü.
  output: 'export',

  // Static export ile image optimization devre dışı (server gerektirir).
  images: {
    unoptimized: true,
  },

  // Trailing slash: static host'lar için iyi pratik.
  trailingSlash: true,

  // GitHub Pages için basePath ve assetPrefix.
  // Cloudflare için boş — root'tan serve.
  basePath: isGitHubPages ? `/${repoName}` : '',
  assetPrefix: isGitHubPages ? `/${repoName}/` : '',
}

export default nextConfig
