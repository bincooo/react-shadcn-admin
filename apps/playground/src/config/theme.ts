import type { ComponentType } from 'react'
import { Monitor, Moon, Sun, type LucideProps } from 'lucide-react'

export type ThemeMode = 'light' | 'dark' | 'auto'

/** 主题模式选项（light/dark/auto），顶栏与主题面板共用 */
export const MODE_OPTIONS: {
  value: ThemeMode
  label: string
  icon: ComponentType<LucideProps>
}[] = [
  { value: 'light', label: 'theme.light', icon: Sun },
  { value: 'dark', label: 'theme.dark', icon: Moon },
  { value: 'auto', label: 'theme.auto', icon: Monitor },
]

export const LAYOUT_OPTIONS = [
  { value: 'vertical', label: 'theme.layoutVertical' },
  { value: 'split', label: 'theme.layoutSplit' },
  { value: 'double', label: 'theme.layoutDouble' },
  { value: 'classic', label: 'theme.layoutClassic' },
  { value: 'mixed', label: 'theme.layoutMixed' },
  { value: 'horizontal', label: 'theme.layoutHorizontal' },
] as const

export type LayoutStyle = (typeof LAYOUT_OPTIONS)[number]['value']

export const LOGIN_STYLE_OPTIONS = [
  {
    value: 'split',
    label: 'theme.loginSplit',
    descriptionKey: 'theme.loginSplitDesc',
  },
  {
    value: 'glass',
    label: 'theme.loginGlass',
    descriptionKey: 'theme.loginGlassDesc',
  },
  {
    value: 'slider',
    label: 'theme.loginSlider',
    descriptionKey: 'theme.loginSliderDesc',
  },
  {
    value: 'bubble',
    label: 'theme.loginBubble',
    descriptionKey: 'theme.loginBubbleDesc',
  },
  {
    value: 'immersive',
    label: 'theme.loginImmersive',
    descriptionKey: 'theme.loginImmersiveDesc',
  },
  {
    value: 'dotgrid',
    label: 'theme.loginDotgrid',
    descriptionKey: 'theme.loginDotgridDesc',
  },
] as const

export type LoginStyle = (typeof LOGIN_STYLE_OPTIONS)[number]['value']

/** 暗色侧边栏的生效范围（双列 / 分栏布局有两列侧栏时可选） */
type DarkSidebarScope = 'first' | 'all'

export interface StatusColors {
  success: string
  warning: string
  danger: string
  info: string
}

export interface ThemeConfig {
  /** 主题模式 */
  mode: ThemeMode
  /** 主题颜色 */
  primaryColor: string
  /** 状态颜色 */
  statusColors: StatusColors
  /** 布局样式 */
  layoutStyle: LayoutStyle
  /** 登录页风格 */
  loginStyle: LoginStyle
  /** 是否允许从登录页进入注册流程 */
  registrationEnabled: boolean

  /* ---- 界面 ---- */
  sidebarWidth: number
  /** 暗色侧边栏：深色底 + 浅色文字，与整体明暗模式独立 */
  darkSidebar: boolean
  /** 暗色侧栏范围：双列 / 分栏布局下只暗第一列，还是两列都暗 */
  darkSidebarScope: DarkSidebarScope
  /** 将悬浮菜单切换为分类网格面板 */
  menuPanelMode: boolean
  headerHeight: number
  showTabs: boolean
  showBreadcrumb: boolean
  keepAlive: boolean
  showFooter: boolean
  borderRadius: number
  contentWidth: 'fluid' | 'boxed'
  pageTransition: boolean

  /* ---- 扩展 ---- */
  /** 水印文字；留空时回退到当前登录用户名 */
  watermarkText: string
  watermark: boolean
  grayMode: boolean
  colorWeak: boolean
  autoLock: boolean
  /** 页脚版权文案；留空时回退到默认版权模板 */
  copyrightText: string
  copyright: boolean
}

/** 状态色的唯一清单：默认值、面板行、重置逻辑都从这里派生 */
export const STATUS_COLORS: {
  key: keyof StatusColors
  label: string
  fallback: string
}[] = [
  { key: 'success', label: 'theme.success', fallback: '#389E0D' },
  { key: 'warning', label: 'theme.warning', fallback: '#D48806' },
  { key: 'danger', label: 'theme.danger', fallback: '#CF1322' },
  { key: 'info', label: 'theme.info', fallback: '#0958D9' },
]

export const DEFAULT_STATUS_COLORS = Object.fromEntries(
  STATUS_COLORS.map(({ key, fallback }) => [key, fallback]),
) as unknown as StatusColors

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'auto',
  primaryColor: '#1677FF',
  statusColors: { ...DEFAULT_STATUS_COLORS },
  layoutStyle: 'double',
  loginStyle: 'split',
  registrationEnabled: false,

  sidebarWidth: 232,
  darkSidebar: false,
  darkSidebarScope: 'first',
  menuPanelMode: false,
  headerHeight: 56,
  showTabs: true,
  showBreadcrumb: true,
  keepAlive: true,
  showFooter: true,
  borderRadius: 6,
  contentWidth: 'fluid',
  pageTransition: true,

  watermarkText: '',
  watermark: false,
  grayMode: false,
  colorWeak: false,
  autoLock: false,
  copyrightText: '',
  copyright: true,
}

export const PRESET_COLORS = [
  '#1677FF',
  '#0958D9',
  '#2F54EB',
  '#722ED1',
  '#13C2C2',
  '#0E7A6B',
  '#FA8C16',
  '#40A9FF',
  '#F5222D',
  '#9254DE',
  '#EB2F96',
  '#08979C',
]
