import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_THEME,
  type LayoutStyle,
  type LoginStyle,
  type StatusColors,
  type ThemeConfig,
  type ThemeMode,
} from '@/config/theme'

interface ThemeActions {
  setMode: (mode: ThemeMode) => void
  setPrimaryColor: (color: string) => void
  setStatusColor: (key: keyof StatusColors, color: string) => void
  resetStatusColors: () => void
  setLayoutStyle: (layoutStyle: LayoutStyle) => void
  setLoginStyle: (style: LoginStyle) => void
  setRegistrationEnabled: (enabled: boolean) => void
  update: (patch: Partial<ThemeConfig>) => void
  resetAll: () => void
}

type ThemeState = ThemeConfig & ThemeActions

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** 整个应用共用同一个 MediaQueryList，避免每次读取/订阅都重新解析媒体查询 */
const darkQuery =
  typeof window === 'undefined' ? null : window.matchMedia(DARK_QUERY)

/** 订阅系统明暗切换（主题运行时与 useSyncExternalStore 共用） */
export function subscribeSystemTheme(onChange: () => void) {
  darkQuery?.addEventListener('change', onChange)
  return () => darkQuery?.removeEventListener('change', onChange)
}

/** 系统当前是否偏好暗色 */
export function systemPrefersDark(): boolean {
  return darkQuery?.matches ?? false
}

/** `auto` 时跟随系统，其余模式原样返回 */
export function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'auto') return mode
  return systemPrefersDark() ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...DEFAULT_THEME,

      setMode: (mode) => set({ mode }),
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
      setStatusColor: (key, color) =>
        set((state) => ({
          statusColors: { ...state.statusColors, [key]: color },
        })),
      resetStatusColors: () =>
        set({ statusColors: { ...DEFAULT_THEME.statusColors } }),
      setLayoutStyle: (layoutStyle) => set({ layoutStyle }),
      setLoginStyle: (loginStyle) => set({ loginStyle }),
      setRegistrationEnabled: (registrationEnabled) =>
        set({ registrationEnabled }),
      update: (patch) => set(patch),
      resetAll: () => set({ ...DEFAULT_THEME }),
    }),
    {
      name: 'react-admin-theme',
      // 只持久化配置项：动作是函数，不落库
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ) as ThemeConfig,
      merge: (persisted, current) => {
        const {
          layout: legacyLayout,
          showCopyright: legacyCopyright,
          ...saved
        } = persisted as Partial<ThemeConfig> & {
          layout?: LayoutStyle
          showCopyright?: boolean
        }
        return {
          ...current,
          ...saved,
          layoutStyle: saved.layoutStyle ?? legacyLayout ?? current.layoutStyle,
          copyright: saved.copyright ?? legacyCopyright ?? current.copyright,
        }
      },
    },
  ),
)

/** 图表主题配色（坐标轴 / 网格 / 标签 / 提示框），各图表页共用 */
const CHART_THEMES = {
  light: {
    axisColor: '#d9d9d9',
    gridColor: '#f0f0f0',
    labelColor: 'rgba(0,0,0,0.65)',
    tooltipBg: '#fff',
    tooltipBorder: '#f0f0f0',
    tooltipText: 'rgba(0,0,0,0.88)',
  },
  dark: {
    axisColor: '#424242',
    gridColor: '#303030',
    labelColor: 'rgba(255,255,255,0.65)',
    tooltipBg: '#1f1f1f',
    tooltipBorder: '#424242',
    tooltipText: 'rgba(255,255,255,0.85)',
  },
} as const

export type ChartTheme = (typeof CHART_THEMES)['light' | 'dark']

/** 同一模式下返回同一份对象，调用方可以直接把它放进 memo 依赖 */
export function chartTheme(resolvedMode: 'light' | 'dark'): ChartTheme {
  return CHART_THEMES[resolvedMode]
}
