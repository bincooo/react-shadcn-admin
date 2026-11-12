import { lazy } from 'react'
import { SquareKanban } from 'lucide-react'
import type { RouteModuleDefinition } from '../types'

const Dashboard = lazy(() => import('@/pages/dashboard'))

export const routeModule = {
  kind: 'business',
  order: 10,
  routes: [
    {
      path: 'dashboard',
      element: <Dashboard />,
      handle: {
        title: 'menu.workspace',
        breadcrumb: ['menu.dashboard', 'menu.workspace'],
        icon: SquareKanban,
      },
    },
  ],
} satisfies RouteModuleDefinition
