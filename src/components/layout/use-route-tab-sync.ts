import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useAppStore } from '@/store/app'
import { findRouteEntry } from '@/router/modules'

/**
 * # Route → tab state
 * Mirror the active static route's title and path into the tab store; menu data is irrelevant.
 */
export function useRouteTabSync() {
  const { pathname } = useLocation()
  const addTab = useAppStore((state) => state.addTab)

  useEffect(() => {
    const route = findRouteEntry(pathname)
    if (!route) return
    addTab({ key: route.path, path: route.path, title: route.title })
  }, [pathname, addTab])
}
