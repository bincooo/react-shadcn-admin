/** 侧边栏文字层级 */
export const TEXT_72 = 'text-sidebar-foreground/72'
/** 菜单文字的三档透明度，统一在此维护避免各处写死 */
export const TEXT_60 = 'text-sidebar-foreground/60'
export const TEXT_90 = 'text-sidebar-foreground/90'
/** 分组标题右侧的展开箭头（Radix Collapsible 在触发器上写 data-state） */
export const CHEVRON =
  'text-sidebar-foreground/45 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180'
/** 未激活菜单项：90% 文字 + 悬停底色/前景 */
export const INACTIVE_ITEM = `${TEXT_90} hover:bg-sidebar-accent`
/** 菜单选中项的底色与文字色（随主色变化） */
export const ACTIVE_ITEM = 'bg-primary/[0.08] text-primary'

/**
 * 浮层菜单的文字层级：浮层经 portal 挂到 body，底色是 --popover，
 * 因此不能沿用 --sidebar-foreground —— 亮色模式 + 暗色侧边栏时侧边栏文字是浅色，
 * 落到白色浮层上就是浅字白底。
 */
export const FLYOUT_TEXT_55 = 'text-popover-foreground/55'
/** 浮层内的未激活菜单项：popover 前景 + 中性选中底 */
export const FLYOUT_INACTIVE_ITEM =
  'text-popover-foreground/72 hover:bg-accent hover:text-popover-foreground'
/** 浮层菜单行：叶子链接与可展开触发项共用高度 / 间距 / 圆角 */
export const FLYOUT_ROW = 'h-9.5 gap-2.5 rounded-md px-2.5 text-[13.5px]'

/** 各栏位菜单项共用的图标尺寸与未激活图标颜色 */
export const MENU_VARIANTS = {
  primary: { icon: 'size-4.5', inactiveIcon: TEXT_60 },
  secondary: { icon: 'size-4', inactiveIcon: TEXT_90 },
} as const
/** 菜单项共用的过渡与焦点环（outline 归各调用方，避免改变既有焦点外观） */
export const MENU_FOCUS =
  'transition-[background-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:inset-ring-2 focus-visible:inset-ring-ring/50'
/** 浮层内菜单项：只有外环，没有内环 */
export const MENU_FOCUS_SIMPLE =
  'transition-[background-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-ring/50'

/** 收起态浮层菜单的统一外观（固定宽度让多级链条对齐成整齐的阶梯） */
export const FLYOUT_POPOVER =
  'w-44 gap-0 bg-popover p-1.5 shadow-lg ring-1 ring-border rounded-sm'
/** 大型分类面板自带边框、底色和阴影，清除 HoverCard 的紧凑列表外观。 */
export const MENU_PANEL_POPOVER =
  'w-auto overflow-visible bg-transparent p-0 shadow-none ring-0'

/** 按层级计算左内边距：每深一级缩进 18px（1 级 = 12px 基准） */
export function indent(depth: number) {
  return { paddingLeft: `${12 + depth * 18}px` }
}
