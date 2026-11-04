import type { ChartTheme } from '@/store/theme'

/** 图表文字样式：图例与坐标轴标签共用 */
export function chartLabelStyle(theme: ChartTheme, fontSize: number) {
  return { color: theme.labelColor, fontSize }
}

/** 类目轴 / 数值轴的默认 tooltip 触发方式 */
export const AXIS_TOOLTIP = { trigger: 'axis' } as const

/** 图例标记的默认尺寸 */
export const LEGEND_MARKER = { itemWidth: 8, itemHeight: 8 } as const
