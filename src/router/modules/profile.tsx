/* eslint-disable react-refresh/only-export-components -- 路由模块导出路由定义 */
import { lazy } from 'react'
import { UserRound } from 'lucide-react'
import type { RouteModuleDefinition } from '../types'

const Profile = lazy(() => import('@/pages/profile'))

export const routeModule = {
  kind: 'business',
  order: 30,
  routes: [
    {
      path: 'profile',
      element: <Profile />,
      handle: {
        title: 'menu.profile',
        breadcrumbKeys: ['menu.profile'],
        icon: UserRound,
      },
    },
  ],
} satisfies RouteModuleDefinition
