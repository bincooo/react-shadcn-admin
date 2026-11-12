import { useSyncExternalStore } from 'react'
import {
  resolveMode,
  subscribeColorScheme,
  prefersDark,
  useThemeStore,
} from '@/store/theme'
import type { ThemeConfig } from '@/config/theme'

/* ------------------------------ 系统主题订阅 ------------------------------ */

const getPreferredMode = (): 'light' | 'dark' =>
  prefersDark() ? 'dark' : 'light'

/** 当前实际生效的明暗模式（`auto` 时跟随系统），供图表等需要具体色值的场景使用 */
export function useResolvedMode(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode)
  const preferredMode = useSyncExternalStore(
    subscribeColorScheme,
    getPreferredMode,
    () => 'light' as const,
  )
  return mode === 'auto' ? preferredMode : mode
}

/* ------------------------------ CSS 变量写入 ------------------------------ */

/**
 * 把主题配置映射为 CSS 变量 / 类名，写入 <html>。
 * 纯副作用函数，不参与 React 渲染，避免主题切换引发组件树重绘。
 */
function applyTheme(config: ThemeConfig, resolved: 'light' | 'dark') {
  const root = document.documentElement
  const isDark = resolved === 'dark'

  root.classList.toggle('dark', isDark)
  root.dataset.themeMode = resolved
  root.style.colorScheme = resolved

  // 主题色：明暗模式共用同一个主色；
  // 前景色 / 焦点环 / 悬停填充由 CSS 从 --primary 派生
  root.style.setProperty('--primary', config.primaryColor)

  // 中性选中态浅底（下拉 / 搜索面板共用）：主色留给按钮与链接；
  // 前景色固定跟随 --foreground，由 CSS 别名处理
  root.style.setProperty('--accent', isDark ? '#424242' : '#f5f5f5')

  // 侧边栏三种情形：暗色模式 / 亮色 + 暗色侧边栏 / 亮色 + 普通侧边栏
  const darkSidebar = isDark || config.darkSidebar
  root.style.setProperty('--sidebar', darkSidebar ? '#1f1f1f' : '#ffffff')
  root.style.setProperty(
    '--sidebar-foreground',
    darkSidebar ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.88)',
  )
  root.style.setProperty(
    '--sidebar-accent',
    darkSidebar ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
  )
  root.style.setProperty(
    '--sidebar-border',
    darkSidebar ? '#303030' : '#d9d9d9',
  )

  // 双列 / 分栏布局下暗色侧栏可以选择只作用于第一列：
  // 第二列的浅色配色由 CSS 按这个 data 属性覆盖（见 index.css）。
  // 只在暗色侧栏真正生效（亮色模式 + 开关开启）时应用；
  // 黑暗模式下开关与范围都被禁用，不得产生效果（两列都保持暗色）
  const twoColumn =
    config.layoutStyle === 'split' || config.layoutStyle === 'double'
  root.dataset.sidebarScope =
    !isDark &&
    config.darkSidebar &&
    config.darkSidebarScope === 'first' &&
    twoColumn
      ? 'first'
      : 'all'

  // 状态色：浅底与描边由组件用 Tailwind 透明度修饰符派生，不再单独写变量
  for (const [key, value] of Object.entries(config.statusColors)) {
    root.style.setProperty(`--${key}`, value)
  }

  // 圆角与尺寸
  root.style.setProperty('--radius', `${config.borderRadius}px`)
  root.style.setProperty('--sidebar-width', `${config.sidebarWidth}px`)
  root.style.setProperty('--header-height', `${config.headerHeight}px`)

  // 无障碍 / 扩展
  root.classList.toggle('gray-mode', config.grayMode)
  root.classList.toggle('color-weak', config.colorWeak)
  root.dataset.contentWidth = config.contentWidth
}

/**
 * 启动主题运行时：初次渲染前写入一次，之后订阅 store 与系统主题变化。
 * 在 main.tsx 里调用一次，返回清理函数（仅用于 HMR / 卸载）。
 */
export function initThemeRuntime() {
  const apply = () => {
    const state = useThemeStore.getState()
    applyTheme(state, resolveMode(state.mode))
  }

  apply()
  const unsubStore = useThemeStore.subscribe(apply)
  const unsubColorScheme = subscribeColorScheme(apply)

  return () => {
    unsubStore()
    unsubColorScheme()
  }
}
