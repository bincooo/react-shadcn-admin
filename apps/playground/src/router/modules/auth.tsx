import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router'
import { FullPageLoader } from '@/components/common/header'

const Login = lazy(() => import('@/pages/login'))

export const authRoute: RouteObject = {
  path: '/login',
  element: (
    <Suspense fallback={<FullPageLoader />}>
      <Login />
    </Suspense>
  ),
}
