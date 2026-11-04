/* eslint-disable react-refresh/only-export-components -- 路由模块导出路由定义 */
import { lazy } from 'react'
import { Activity, SquareKanban } from 'lucide-react'
import type { RouteModuleDefinition } from '../types'

const Dashboard = lazy(() => import('@/pages/dashboard'))
const Monitor = lazy(() => import('@/pages/dashboard/monitor'))

export const routeModule = {
  kind: 'business',
  order: 10,
  routes: [
    {
      path: 'dashboard',
      element: <Dashboard />,
      handle: {
        title: 'menu.workspace',
        breadcrumbKeys: ['menu.dashboard', 'menu.workspace'],
        icon: SquareKanban,
      },
    },
    {
      path: 'dashboard/monitor',
      element: <Monitor />,
      handle: {
        title: 'menu.monitor',
        breadcrumbKeys: ['menu.dashboard', 'menu.monitor'],
        icon: Activity,
      },
    },
  ],
} satisfies RouteModuleDefinition
