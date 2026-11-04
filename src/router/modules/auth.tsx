/* eslint-disable react-refresh/only-export-components -- 路由模块导出路由定义 */
import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router'
import { FullPageLoader } from '@/components/common/full-page-loader'

const Login = lazy(() => import('@/pages/login'))

export const authRoute: RouteObject = {
  path: '/login',
  element: (
    <Suspense fallback={<FullPageLoader />}>
      <Login />
    </Suspense>
  ),
}
