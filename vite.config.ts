import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages: set VITE_BASE=/REPO_NAME/ when deploying under a project site.
// For user/org site (username.github.io) leave as /.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'EmlakVR — Gör, Yerleştir, Fiyatla, Kanıtla',
        short_name: 'EmlakVR',
        description:
          'VR/AR destekli emlak ve dekorasyon: milimetrik yerleştirme, canlı fiyat, vaat-kanıt karşılaştırma.',
        theme_color: '#1a2e24',
        background_color: '#0f1a15',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        lang: 'tr',
        categories: ['lifestyle', 'productivity', 'business'],
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
