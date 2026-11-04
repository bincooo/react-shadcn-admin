export const dashboardFixture = {
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
    {
      nameKey: 'page.direct',
      value: 1048,
    },
    {
      nameKey: 'page.searchEngine',
      value: 735,
    },
    {
      nameKey: 'page.social',
      value: 580,
    },
    {
      nameKey: 'page.email',
      value: 484,
    },
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
  quickLinks: [
    {
      label: 'menu.components',
      path: '/components',
    },
    {
      label: 'menu.monitor',
      path: '/dashboard/monitor',
    },
  ],
}
