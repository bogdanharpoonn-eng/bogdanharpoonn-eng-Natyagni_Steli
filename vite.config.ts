/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fonts/NotoSans-Regular.ttf'],

      manifest: {
        name: 'Замір натяжних стель',
        short_name: 'Замір стель',
        description: 'Офлайн PWA для замірників натяжних стель',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        lang: 'uk',
        start_url: '/',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/svg2pdf')) {
            return 'pdf'
          }
          if (id.includes('node_modules/dexie')) {
            return 'dexie'
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react'
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
