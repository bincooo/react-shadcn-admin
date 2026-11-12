import type { EChartsCoreOption } from 'echarts/core'
import type { ChartTheme } from '@/store/theme'

/** 与 echarts 解耦的图表配置类型：图表页只依赖这里，不必静态引入 echarts */
export type ChartOption = EChartsCoreOption

/** 图表坐标轴 / 标签的字号，各图表页共用 */
export const CHART_FONT = 11
export const CHART_FONT_SM = 10

/** 图表文字样式：图例与坐标轴标签共用 */
export function chartLabelStyle(theme: ChartTheme, fontSize: number) {
  return { color: theme.labelColor, fontSize }
}

/** 类目轴 / 数值轴的默认 tooltip 触发方式 */
export const AXIS_TOOLTIP = { trigger: 'axis' } as const

/** 图例标记的默认尺寸 */
export const LEGEND_MARKER = { itemWidth: 8, itemHeight: 8 } as const
