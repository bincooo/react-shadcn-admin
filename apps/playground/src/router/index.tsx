import { Suspense } from 'react'
import { Navigate, useRoutes, type RouteObject } from 'react-router'
import { FullPageLoader } from '@/components/common/header'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AuthenticationGuard } from './guard'
import { mergeRouteModules, routeModules } from './modules'
import { authRoute } from './modules/auth'

const routes: RouteObject[] = [
  authRoute,
  {
    path: '/',
    element: (
      <AuthenticationGuard>
        <Suspense fallback={<FullPageLoader />}>
          <AdminLayout />
        </Suspense>
      </AuthenticationGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...mergeRouteModules(...routeModules.map((module) => module.routes)),
    ],
  },
]

export function AppRoutes() {
  return useRoutes(routes)
}
