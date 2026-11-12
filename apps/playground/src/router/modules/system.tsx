import { lazy } from 'react'
import type { RouteModuleDefinition } from '../types'

const NotFound = lazy(() => import('@/pages/not-found'))

export const routeModule = {
  kind: 'system',
  order: 100,
  routes: [
    {
      path: '*',
      element: <NotFound />,
      handle: {
        title: '404',
        breadcrumb: ['404'],
      },
    },
  ],
} satisfies RouteModuleDefinition
