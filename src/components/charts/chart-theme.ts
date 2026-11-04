import type { EChartsCoreOption } from 'echarts/core'

/** 与 echarts 解耦的图表配置类型：图表页只依赖这里，不必静态引入 echarts */
export type ChartOption = EChartsCoreOption

/** 图表坐标轴 / 标签的字号，各图表页共用 */
export const CHART_FONT = 11
export const CHART_FONT_SM = 10
