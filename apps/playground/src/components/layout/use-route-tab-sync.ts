import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useAppStore } from '@/store/app'
import { findRouteEntry } from '@/router/modules'

/**
 * # Route → tab state
 * Mirror the active static route's title and path into the tab store; menu data is irrelevant.
 *
 * 未注册的路径也会生成页签：路由表的 `*` 兜底路由会渲染 404，页签统一
 * 显示「404」，key 仍用实际路径，保证每个不存在的地址都能单独关闭 / 刷新。
 */
export function useRouteTabSync() {
  const { pathname } = useLocation()
  const addTab = useAppStore((state) => state.addTab)

  useEffect(() => {
    const path = pathname.replace(/\/+$/, '') || '/'
    // 根路径会立即重定向到工作台，不产生临时页签
    if (path === '/') return
    const route = findRouteEntry(path)
    if (route) {
      addTab({ key: route.path, path: route.path, title: route.title })
      return
    }
    addTab({ key: path, path, title: '404' })
  }, [pathname, addTab])
}
