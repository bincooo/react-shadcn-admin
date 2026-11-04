import {
  CHART_FONT_SM,
  type ChartOption,
} from '@/components/charts/chart-theme'
import type { MonitorData } from '@/api/monitor'
import type { ChartTheme } from '@/store/theme'
import {
  AXIS_TOOLTIP,
  chartLabelStyle,
  LEGEND_MARKER,
} from '../../modules/chart-defaults'

/** 类目轴：时间刻度，公共样式一致 */
function categoryAxis(times: string[], theme: ChartTheme) {
  return {
    type: 'category' as const,
    data: times,
    axisLabel: chartLabelStyle(theme, CHART_FONT_SM),
    axisLine: { show: false },
    axisTick: { show: false },
  }
}

/** 数值轴：网格线跟随主题 */
function valueAxis(theme: ChartTheme, max?: number) {
  return {
    type: 'value' as const,
    max,
    axisLabel: chartLabelStyle(theme, CHART_FONT_SM),
    splitLine: { lineStyle: { color: theme.gridColor } },
  }
}

/** 网络流量折线：两条线只差名称与数据 */
function networkLine(name: string, data: number[]) {
  return {
    name,
    type: 'line' as const,
    smooth: true,
    data,
    showSymbol: false,
    lineStyle: { width: 2 },
  }
}

/** CPU 使用率柱状图 */
export function buildCpuOption(
  times: string[],
  cpu: number[],
  theme: ChartTheme,
  primaryColor: string,
): ChartOption {
  return {
    grid: { top: 20, right: 12, bottom: 24, left: 36 },
    tooltip: AXIS_TOOLTIP,
    xAxis: categoryAxis(times, theme),
    yAxis: valueAxis(theme, 100),
    series: [
      {
        type: 'bar',
        data: cpu,
        itemStyle: { color: primaryColor, borderRadius: [4, 4, 0, 0] },
        barWidth: 14,
      },
    ],
  }
}

/** 网络出 / 入流量折线图 */
export function buildNetworkOption(
  times: string[],
  network: MonitorData['network'],
  theme: ChartTheme,
  names: { inbound: string; outbound: string },
): ChartOption {
  return {
    grid: { top: 28, right: 12, bottom: 24, left: 40 },
    tooltip: AXIS_TOOLTIP,
    legend: {
      top: 0,
      right: 0,
      ...LEGEND_MARKER,
      textStyle: chartLabelStyle(theme, CHART_FONT_SM),
    },
    xAxis: categoryAxis(times, theme),
    yAxis: valueAxis(theme),
    series: [
      networkLine(names.inbound, network.inbound),
      networkLine(names.outbound, network.outbound),
    ],
  }
}

/** 健康度仪表盘 */
export function buildHealthOption(
  health: number,
  resolvedMode: 'light' | 'dark',
  primaryColor: string,
): ChartOption {
  const dark = resolvedMode === 'dark'
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        radius: '92%',
        center: ['50%', '58%'],
        min: 0,
        max: 100,
        splitNumber: 5,
        progress: { show: true, width: 10, itemStyle: { color: primaryColor } },
        axisLine: {
          lineStyle: { width: 10, color: [[1, dark ? '#2b2b31' : '#ececf1']] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 26,
          fontWeight: 600,
          offsetCenter: [0, 0],
          formatter: '{value}%',
          color: dark ? '#eee' : '#1b1b1f',
        },
        data: [{ value: health }],
      },
    ],
  }
}
