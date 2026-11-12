import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { vitePluginFakeServer } from 'vite-plugin-fake-server'

const ICON_CHUNK_PREFIX_LENGTH = 3

// lucide 1.x 的 ESM 产物是 .mjs（0.x 为 .js），两种扩展名都要覆盖
const DYNAMIC_ICON_MODULES =
  /[/\\]lucide-react[/\\]dist[/\\]esm[/\\](dynamicIconImports|DynamicIcon)\.m?js$/

function iconChunkBucket(id: string): string | undefined {
  if (DYNAMIC_ICON_MODULES.test(id)) return 'icon-table'
  const matched =
    /[/\\]lucide-react[/\\]dist[/\\]esm[/\\]icons[/\\]([^/\\]+)\.m?js$/.exec(id)
  if (!matched) return undefined
  const prefix = matched[1]
    .slice(0, ICON_CHUNK_PREFIX_LENGTH)
    .replace(/[^a-z\d]/g, 'x')
  return `icon-${prefix}`
}

const CHUNK_GROUPS: { name: string; test: RegExp }[] = [
  { name: 'echarts', test: /[\\/]node_modules[\\/](echarts|zrender)[\\/]/ },
  {
    name: 'base-ui',
    test: /[\\/]node_modules[\\/]@base-ui[\\/]/,
  },
  {
    name: 'tanstack',
    test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
  },
  {
    name: 'i18n',
    test: /[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/,
  },
  {
    name: 'floating-ui',
    test: /[\\/]node_modules[\\/]@floating-ui[\\/]/,
  },
  {
    name: 'icons',
    test: /[\\/]node_modules[\\/]lucide-react[\\/](?!dist[\\/]esm[\\/]icons[\\/])/,
  },
  {
    name: 'pinyin',
    test: /[\\/]node_modules[\\/]pinyin-pro[\\/]/,
  },
  {
    name: 'vendor',
    test: /[\\/]node_modules[\\/](ky|sonner|zustand|keepalive-for-react|class-variance-authority|cn|react-countup|react-error-boundary)[\\/]/,
  },
  {
    name: 'react',
    test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
  },
  { name: 'motion', test: /[\\/]node_modules[\\/](motion|framer-motion)[\\/]/ },
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = env.VITE_MOCK === 'true'
  return {
    base: env.VITE_PREFIX || '/',
    plugins: [
      react(),
      tailwindcss(),
      useMock
        ? vitePluginFakeServer({
            include: ['fake/mock'],
            enableDev: true,
            enableProd: true,
          })
        : null,
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      watch: {
        ignored: [
          '**/.npm/**',
          '**/.tooling/**',
          '**/.local/**',
          '**/.cache/**',
        ],
      },
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      allowedHosts: true,
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (/preload-helper/.test(id)) return 'preload-helper'
            if (!id.includes('node_modules')) return undefined
            const iconBucket = iconChunkBucket(id)
            if (iconBucket) return iconBucket
            const grouped = CHUNK_GROUPS.find((group) => group.test.test(id))
            return grouped?.name
          },
        },
      },
    },
  }
})
