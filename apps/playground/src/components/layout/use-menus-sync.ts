import { useState } from 'react'
import { useLocation } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  containsMenuPath,
  type MenuApiNode,
  type MenuNode,
} from '@/components/layout/menu/menu-model'
import { get } from '@/lib/http'

interface MenuListResponse {
  menus: MenuApiNode[]
}

const EMPTY_MENU_DATA: MenuApiNode[] = []

function findActiveGroup(menus: MenuNode[], pathname: string) {
  return menus.find((node) => containsMenuPath(node, pathname))
}

/**
 * # Async source
 * Menu API data is used only to render navigation; routes remain statically registered.
 * # Failure behavior
 * While loading or after failure, the stable empty array keeps the sidebar empty.
 */
export function useSidebarMenusSync() {
  const query = useQuery({
    queryKey: ['nav-menu'],
    queryFn: () => get<MenuListResponse>('/menus'),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 0,
  })

  const menus = query.data?.menus ?? EMPTY_MENU_DATA
  return { menus }
}

/** 当前路径对应的侧栏一级分组。 */
export function useActiveSidebarGroupSync(): MenuNode | undefined {
  const { pathname } = useLocation()
  const { menus } = useSidebarMenusSync()
  return findActiveGroup(menus, pathname)
}

/** 第一栏选中分组的记录；记录时的路由一旦变化，选中态即失效。 */
interface RailSelection {
  key: string
  pathname: string
}

/**
 * 双栏 / 分栏布局第一栏的分组选中态。
 * 目录节点只切换第二栏、不改变路由；路由变化后回到当前路由所属分组。
 */
export function useSidebarRailSync(split: boolean) {
  const { pathname } = useLocation()
  const { menus } = useSidebarMenusSync()
  const [railSelectionState, setRailSelection] = useState<RailSelection | null>(
    null,
  )

  const activeGroup = findActiveGroup(menus, pathname)
  const railItems = split ? activeGroup?.children : menus
  const routeItem = railItems?.find((node) => containsMenuPath(node, pathname))
  const selectedItem =
    (railSelectionState?.pathname === pathname
      ? railItems?.find((node) => node.key === railSelectionState.key)
      : undefined) ?? routeItem

  const selectRailItem = (key: string) => setRailSelection({ key, pathname })

  return { railItems, selectedItem, selectRailItem }
}
