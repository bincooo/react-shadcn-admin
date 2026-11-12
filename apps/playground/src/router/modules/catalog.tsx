import { lazy } from 'react'
import {
  Building2,
  Menu,
  ShieldUser,
  ToggleLeft,
  Users as UsersIcon,
} from 'lucide-react'
import type { RouteModuleDefinition } from '../types'

const Components = lazy(() => import('@/pages/components'))
const Users = lazy(() => import('@/pages/system/user'))
const Menus = lazy(() => import('@/pages/system/menu'))
const Roles = lazy(() => import('@/pages/system/role'))
const Depts = lazy(() => import('@/pages/system/dept'))

export const routeModule = {
  kind: 'business',
  order: 20,
  routes: [
    {
      path: 'components',
      element: <Components />,
      handle: {
        title: 'menu.components',
        breadcrumb: ['menu.components'],
        icon: ToggleLeft,
      },
    },
    {
      path: 'system/users',
      element: <Users />,
      handle: {
        title: 'menu.user',
        breadcrumb: ['menu.system', 'menu.user'],
        icon: UsersIcon,
      },
    },
    {
      path: 'system/menus',
      element: <Menus />,
      handle: {
        title: 'menu.menus',
        breadcrumb: ['menu.system', 'menu.menus'],
        icon: Menu,
      },
    },
    {
      path: 'system/roles',
      element: <Roles />,
      handle: {
        title: 'menu.role',
        breadcrumb: ['menu.system', 'menu.role'],
        icon: ShieldUser,
      },
    },
    {
      path: 'system/depts',
      element: <Depts />,
      handle: {
        title: 'menu.dept',
        breadcrumb: ['menu.system', 'menu.dept'],
        icon: Building2,
      },
    },
  ],
} satisfies RouteModuleDefinition
