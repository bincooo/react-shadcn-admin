import { useSyncExternalStore } from 'react'
import { mixPrimary } from '@/lib/color'
import {
  resolveMode,
  subscribeSystemTheme,
  systemPrefersDark,
  useThemeStore,
} from '@/store/theme'
import type { ThemeConfig } from '@/config/theme'

/* ------------------------------ 系统主题订阅 ------------------------------ */

const getSystemTheme = (): 'light' | 'dark' =>
  systemPrefersDark() ? 'dark' : 'light'

/** 当前实际生效的明暗模式（`auto` 时跟随系统），供图表等需要具体色值的场景使用 */
export function useResolvedMode(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode)
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    () => 'light' as const,
  )
  return mode === 'auto' ? systemTheme : mode
}

/* ------------------------------ CSS 变量写入 ------------------------------ */

const STATUS_SOFT_TINT: Record<
  keyof ThemeConfig['statusColors'],
  [number, number]
> = {
  success: [12, 34],
  warning: [12, 34],
  danger: [10, 30],
  info: [12, 34],
}

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

  // 主题色：明暗模式共用同一个主色，主色按钮文字固定白色
  root.style.setProperty('--primary', config.primaryColor)
  root.style.setProperty('--primary-foreground', '#FFFFFF')
  root.style.setProperty('--ring', config.primaryColor)

  root.style.setProperty('--primary-hover-fill', mixPrimary(82, 'white'))
  root.style.setProperty('--primary-active-fill', mixPrimary(84, 'black'))
  root.style.setProperty(
    '--primary-border',
    mixPrimary(42, 'var(--background)'),
  )
  root.style.setProperty(
    '--primary-soft',
    mixPrimary(isDark ? 18 : 9, 'var(--background)'),
  )
  root.style.setProperty(
    '--primary-soft-hover',
    mixPrimary(isDark ? 26 : 22, 'var(--background)'),
  )

  // 中性选中态浅底（下拉 / 搜索面板共用）：主色留给按钮与链接
  root.style.setProperty('--accent', isDark ? '#424242' : '#f5f5f5')
  root.style.setProperty(
    '--accent-foreground',
    isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
  )

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

  // 状态色 + 派生浅底 / 描边
  for (const [key, value] of Object.entries(config.statusColors)) {
    const [soft, border] =
      STATUS_SOFT_TINT[key as keyof typeof STATUS_SOFT_TINT]
    root.style.setProperty(`--${key}`, value)
    root.style.setProperty(
      `--${key}-soft`,
      `color-mix(in oklab, ${value} ${soft}%, var(--background))`,
    )
    root.style.setProperty(
      `--${key}-border`,
      `color-mix(in oklab, ${value} ${border}%, var(--background))`,
    )
  }

  // 圆角与尺寸
  root.style.setProperty('--radius', `${config.borderRadius}px`)
  root.style.setProperty('--sidebar-width', `${config.sidebarWidth}px`)
  root.style.setProperty('--header-height', `${config.headerHeight}px`)

  // 无障碍 / 扩展
  root.classList.toggle('gray-mode', config.grayMode)
  root.classList.toggle('color-weak', config.colorWeak)
  root.classList.toggle('compact-mode', config.compactMode)
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
  const unsubSystem = subscribeSystemTheme(apply)

  return () => {
    unsubStore()
    unsubSystem()
  }
}
