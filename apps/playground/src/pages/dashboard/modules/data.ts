/** 指标卡数据：文案 key 与图标映射由前端按 key 决定 */
export interface StatItem {
  key: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  delta: number
  up: boolean
  tone: 'primary' | 'success' | 'warning' | 'info'
}

/** 工作台读模型：指标卡、趋势、来源、最近订单与快捷入口 */
export interface DashboardData {
  stats: StatItem[]
  traffic: { months: number[]; visits: number[]; orders: number[] }
  sources: { nameKey: string; value: number }[]
  recentOrders: {
    name: string
    amount: number
    statusKey: string
    variant: 'success' | 'warning' | 'secondary'
  }[]
  quickLinks: { label: string; path: string }[]
}

/**
 * 工作台示例数据（写死在组件侧，不依赖 mock 或后端接口）。
 *
 * 接入真实统计接口时可替换本常量，页面结构与图表配置无需改动。
 */
export const DASHBOARD_DATA: DashboardData = {
  stats: [
    {
      key: 'revenue',
      label: 'page.totalRevenue',
      value: 128430,
      prefix: '¥',
      delta: 12.5,
      up: true,
      tone: 'primary',
    },
    {
      key: 'users',
      label: 'page.newUsers',
      value: 3421,
      delta: 8.2,
      up: true,
      tone: 'success',
    },
    {
      key: 'orders',
      label: 'page.orders',
      value: 1290,
      delta: -3.1,
      up: false,
      tone: 'warning',
    },
    {
      key: 'active',
      label: 'page.activeRate',
      value: 68.4,
      suffix: '%',
      delta: 2.4,
      up: true,
      tone: 'info',
    },
  ],
  traffic: {
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    visits: [
      820, 932, 901, 934, 1290, 1330, 1320, 1450, 1380, 1520, 1610, 1740,
    ],
    orders: [620, 732, 701, 734, 890, 930, 820, 950, 880, 1020, 1110, 1240],
  },
  sources: [
    { nameKey: 'page.direct', value: 1048 },
    { nameKey: 'page.searchEngine', value: 735 },
    { nameKey: 'page.social', value: 580 },
    { nameKey: 'page.email', value: 484 },
  ],
  recentOrders: [
    {
      name: '陈星野',
      amount: 1299,
      statusKey: 'page.completed',
      variant: 'success',
    },
    {
      name: '沈知微',
      amount: 899,
      statusKey: 'page.processing',
      variant: 'warning',
    },
    {
      name: '周砚清',
      amount: 459,
      statusKey: 'page.completed',
      variant: 'success',
    },
    {
      name: '林照月',
      amount: 2380,
      statusKey: 'page.refunded',
      variant: 'secondary',
    },
    {
      name: '顾南枝',
      amount: 168,
      statusKey: 'page.completed',
      variant: 'success',
    },
  ],
  quickLinks: [{ label: 'menu.components', path: '/components' }],
}
