/* eslint-disable react-refresh/only-export-components -- 路由模块导出路由定义 */
import { lazy } from 'react'
import { Building2, Menu, ShieldUser, ToggleLeft, Users } from 'lucide-react'
import type { RouteModuleDefinition } from '../types'

const Components = lazy(() => import('@/pages/components'))
const SystemUsers = lazy(() => import('@/pages/system/users'))
const SystemMenus = lazy(() => import('@/pages/system/menus'))
const SystemRoles = lazy(() => import('@/pages/system/roles'))
const SystemDepts = lazy(() => import('@/pages/system/depts'))

export const routeModule = {
  kind: 'business',
  order: 20,
  routes: [
    {
      path: 'components',
      element: <Components />,
      handle: {
        title: 'menu.components',
        breadcrumbKeys: ['menu.components'],
        icon: ToggleLeft,
      },
    },
    {
      path: 'system/users',
      element: <SystemUsers />,
      handle: {
        title: 'menu.user',
        breadcrumbKeys: ['menu.system', 'menu.user'],
        icon: Users,
      },
    },
    {
      path: 'system/menus',
      element: <SystemMenus />,
      handle: {
        title: 'menu.menus',
        breadcrumbKeys: ['menu.system', 'menu.menus'],
        icon: Menu,
      },
    },
    {
      path: 'system/roles',
      element: <SystemRoles />,
      handle: {
        title: 'menu.role',
        breadcrumbKeys: ['menu.system', 'menu.role'],
        icon: ShieldUser,
      },
    },
    {
      path: 'system/depts',
      element: <SystemDepts />,
      handle: {
        title: 'menu.dept',
        breadcrumbKeys: ['menu.system', 'menu.dept'],
        icon: Building2,
      },
    },
  ],
} satisfies RouteModuleDefinition
