import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { generatorApiPlugin } from './server/plugin.mjs'

export default defineConfig({
  plugins: [react(), tailwindcss(), generatorApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: true,
    watch: {
      ignored: ['**/dist/**', '**/data/*.jsonl'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4174,
    allowedHosts: true,
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
})
