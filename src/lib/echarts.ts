/**
 * echarts 按需注册：只引入用到的图表与组件，减小产物体积。
 * 通过 `Chart` 组件的动态 import 加载，独立成一个 chunk。
 */
import * as echarts from 'echarts/core'
import { BarChart, GaugeChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

/** 已注册所需图表与组件的 echarts 实例工厂（由 chart.tsx 动态加载） */
export const init = echarts.init
export type { ECharts, EChartsCoreOption } from 'echarts/core'
