import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { vitePluginFakeServer } from 'vite-plugin-fake-server'
import { visualizer } from 'rollup-plugin-visualizer'

/**
 * 图标模块分组前缀长度：越大分组越多、单组越小。
 *
 * 取 3 是实测折中：2 个字符得 159 组、登录页要拉 22 个请求；逐图标分块（默认行为）粒度最细
 * 但 1800 多个 chunk 在渲染阶段耗尽内存（2GB 环境直接 OOM 被 kill）。
 *
 * 另试过 Rollup 的 `experimentalMinChunkSize`：它会把小 chunk 并回已存在的大 chunk，
 * 结果 1866 个图标全被并回单个 icons chunk（764KB），按需加载失效，不可用。
 */
const ICON_CHUNK_PREFIX_LENGTH = 3

/**
 * `DynamicIcon` 组件与它的名字表（1866 条 `name → () => import()`）。
 *
 * 两者必须**一起**单独成块，且不能留在共享的 `icons` 组里：`icons` 是登录页与后台共用的
 * chunk，`DynamicIcon` 一旦落在其中，它静态引用的名字表也会变成登录页的静态依赖
 * （实测首屏 297KB，其中 91KB 就是这张表），而登录页根本不需要按名字渲染菜单图标。
 */
const DYNAMIC_ICON_MODULES =
  /[/\\]lucide-react[/\\]dist[/\\]esm[/\\](dynamicIconImports|DynamicIcon)\.js$/

/** 图标模块 id → 分组名；非图标模块返回 undefined，交回原有分组逻辑 */
function iconChunkBucket(id: string): string | undefined {
  if (DYNAMIC_ICON_MODULES.test(id)) return 'icon-table'
  const matched =
    /[/\\]lucide-react[/\\]dist[/\\]esm[/\\]icons[/\\]([^/\\]+)\.js$/.exec(id)
  if (!matched) return undefined
  const prefix = matched[1]
    .slice(0, ICON_CHUNK_PREFIX_LENGTH)
    .replace(/[^a-z\d]/g, 'x')
  return `icon-${prefix}`
}

/** 按包名拆分第三方依赖：echarts / motion 体积大且非首屏必需 */
const CHUNK_GROUPS: { name: string; test: RegExp }[] = [
  { name: 'echarts', test: /[\\/]node_modules[\\/](echarts|zrender)[\\/]/ },
  {
    // Radix 各组件共享 @radix-ui/react-primitive / react-compose-refs 等底层包，
    // 按组件拆 chunk 会出现跨 chunk 循环依赖（运行时 "Cannot access 'x' before
    // initialization"），因此整包合成一块。
    name: 'radix',
    test: /[\\/]node_modules[\\/](radix-ui|@radix-ui|@floating-ui)[\\/]/,
  },
  {
    // 只收 lucide 的核心运行时（Icon 基座等）。**不能**匹配整个包：
    // 图标走 `lucide-react/dynamic` 按需加载，一旦 `dist/esm/icons/*.js` 也被指定进本组，
    // Rollup 就无法为其单独出 chunk，1866 个图标会全部堆进同一个 icons chunk
    // （实测 764KB / gzip 154KB），「按需加载」直接失效。
    name: 'icons',
    test: /[\\/]node_modules[\\/]lucide-react[\\/](?!dist[\\/]esm[\\/]icons[\\/])/,
  },
  {
    name: 'react',
    test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
  },
  { name: 'motion', test: /[\\/]node_modules[\\/](motion|framer-motion)[\\/]/ },
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // VITE_MOCK=true 时加载全量 mock（auth / 菜单 / 用户 / 角色 / 部门），可脱离后端纯前端运行；
  // 关闭时只保留 dashboard / monitor 的演示数据，其余 /api 继续走 8080 代理。
  const useMock = env.VITE_MOCK === 'true'
  return {
    base: env.VITE_PREFIX ?? '/',
    plugins: [
      react(),
      tailwindcss(),
      vitePluginFakeServer({
        include: useMock ? ['fake/base', 'fake/mock'] : ['fake/base'],
        enableDev: true,
        enableProd: true,
      }),
      // ANALYZE=1 npm run analyze：产出 stats.json，用于排查 chunk 体积
      process.env.ANALYZE
        ? visualizer({
            filename: 'stats.json',
            template: 'raw-data',
            gzipSize: true,
          })
        : null,
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      // 允许通过反向代理域名（沙箱预览 / 内网穿透）访问
      allowedHosts: true,
      // /api 默认转发到本地 DDD 后端（VITE_PROXY_TARGET 可覆盖，默认 8080）；
      // VITE_MOCK=true 时 fake 中间件先命中，代理只作为未覆盖接口的兜底。
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
      allowedHosts: true,
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          /**
           * 用函数形式按真实模块 id 归组：具名对象只在「包名被直接 import」时才命中子路径。
           *
           * 只按「第三方大包」和「必然整包使用」的库分组：
           *   - radix-ui + @radix-ui + @floating-ui 互相 import 得很密，拆成多个 chunk 会出现
           *     跨 chunk 循环依赖（运行时 "Cannot access 'x' before initialization"），所以合成一块；
           *   - lucide-react 拆分见下方 `iconChunkBucket`：核心运行时归 icons，图标模块按前缀分组；
           *   - 业务 chunk（页面 / 外壳 / 登录风格）交给 Rollup 按动态 import 自然拆分。
           */
          manualChunks(id) {
            // Vite 的动态 import 预加载辅助函数不是 node_modules 里的模块，且几乎每个 chunk 都用它。
            // 不管住它，它就会跟着 `DynamicIcon` 一起被归进 `icon-table`，让入口 chunk 反向静态
            // 依赖那张 1866 条的名字表 —— 登录页首屏白白多下载一大块。
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
