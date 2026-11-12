import {
  AXIS_TOOLTIP,
  CHART_FONT,
  chartLabelStyle,
  LEGEND_MARKER,
  type ChartOption,
} from '@/components/charts/chart-theme'
import { chartPalette } from '@/lib/color'
import type { ChartTheme } from '@/store/theme'
import type { DashboardData } from './data'

/**
 * 访问量趋势：主色实线（带渐变面积）+ 主题色低饱和虚线。
 * 纯函数，便于单独调整图表而不动页面结构。
 */
export function buildTrafficOption(
  data: DashboardData['traffic'],
  labels: string[],
  theme: ChartTheme,
  primaryColor: string,
  lineNames: { visits: string; orders: string },
): ChartOption {
  // 第二条曲线用主题色的低饱和变体，避免突兀的撞色
  const secondaryColor = `color-mix(in oklab, ${primaryColor} 45%, ${theme.axisColor})`

  return {
    grid: { top: 28, right: 16, bottom: 28, left: 44 },
    tooltip: {
      ...AXIS_TOOLTIP,
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      textStyle: { color: theme.tooltipText, fontSize: 12 },
    },
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      ...LEGEND_MARKER,
      textStyle: chartLabelStyle(theme, CHART_FONT),
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: theme.axisColor } },
      axisTick: { show: false },
      axisLabel: chartLabelStyle(theme, CHART_FONT),
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.gridColor } },
      axisLabel: chartLabelStyle(theme, CHART_FONT),
    },
    series: [
      {
        name: lineNames.visits,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: data.visits,
        lineStyle: { width: 2.5, color: primaryColor },
        itemStyle: { color: primaryColor },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${primaryColor}44` },
              { offset: 1, color: `${primaryColor}00` },
            ],
          },
        },
      },
      {
        name: lineNames.orders,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: data.orders,
        lineStyle: { width: 2, color: secondaryColor, type: 'dashed' },
        itemStyle: { color: secondaryColor },
      },
    ],
  }
}

/** 流量来源环形图：颜色使用随主题派生的色板 */
export function buildSourceOption(
  sources: { name: string; value: number }[],
  theme: ChartTheme,
  primaryColor: string,
): ChartOption {
  return {
    color: chartPalette(primaryColor),
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      icon: 'circle',
      ...LEGEND_MARKER,
      textStyle: chartLabelStyle(theme, CHART_FONT),
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: 'transparent',
          borderWidth: 2,
        },
        label: { show: false },
        data: sources,
      },
    ],
  }
}
