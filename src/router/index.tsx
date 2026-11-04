import { lazy, Suspense } from 'react'
import { Navigate, useRoutes, type RouteObject } from 'react-router'
import { FullPageLoader } from '@/components/common/full-page-loader'
import { AuthenticationGuard } from './guard'
import { mergeRouteModules, routeModules } from './modules'
import { authRoute } from './modules/auth'

const AdminLayout = lazy(() =>
  import('@/components/layout/admin-layout').then((module) => ({
    default: module.AdminLayout,
  })),
)

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
