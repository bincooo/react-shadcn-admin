/* eslint-disable react-refresh/only-export-components -- 路由模块导出路由定义 */
import { lazy } from 'react'
import type { RouteModuleDefinition } from '../types'

const NotFound = lazy(() => import('@/pages/not-found'))

export const routeModule = {
  kind: 'system',
  order: 100,
  routes: [{ path: '*', element: <NotFound /> }],
} satisfies RouteModuleDefinition
