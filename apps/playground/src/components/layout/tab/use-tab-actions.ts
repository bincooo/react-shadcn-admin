import { useNavigate } from 'react-router'
import {
  destroyCachedPage,
  refreshCachedPage,
  refreshCurrentPage,
} from '@/lib/keepalive'
import { useAppStore, type TabItem } from '@/store/app'

/**
 * 页签的全部交互动作：切换、关闭、批量关闭、刷新。
 * 页签栏与右键菜单共用，避免同一套逻辑写两遍。
 */
export function useTabActions() {
  const navigate = useNavigate()
  const tabsState = useAppStore((s) => s.tabs)
  const activeKeyState = useAppStore((s) => s.activeKey)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const closeTab = useAppStore((s) => s.closeTab)
  const closeOthersTab = useAppStore((s) => s.closeOthers)
  const closeLeftTab = useAppStore((s) => s.closeLeft)
  const closeRightTab = useAppStore((s) => s.closeRight)
  const closeAllTabs = useAppStore((s) => s.closeAll)

  /** 批量销毁缓存：跳过固定页签 */
  const destroyMany = (list: TabItem[]) => {
    for (const tab of list) {
      if (!tab.affix) destroyCachedPage(tab.key)
    }
  }

  const activate = (tab: TabItem) => {
    setActiveTab(tab.key)
    navigate(tab.path)
  }

  const close = (key: string) => {
    const next = closeTab(key)
    destroyCachedPage(key)
    if (next) navigate(next.path)
  }

  const closeOthers = (key: string) => {
    destroyMany(tabsState.filter((tab) => tab.key !== key))
    closeOthersTab(key)
    const target = tabsState.find((tab) => tab.key === key)
    if (target && key !== activeKeyState) navigate(target.path)
  }

  const closeSide = (key: string, side: 'left' | 'right') => {
    const index = tabsState.findIndex((tab) => tab.key === key)
    const inRange = (i: number) => (side === 'left' ? i < index : i > index)
    destroyMany(tabsState.filter((_, i) => inRange(i)))
    if (side === 'left') closeLeftTab(key)
    else closeRightTab(key)
  }

  const closeAll = () => {
    const remaining = closeAllTabs()
    destroyMany(remaining)
    if (remaining[0]) navigate(remaining[0].path)
  }

  /** 刷新指定页签：有缓存则重建缓存页，否则重挂载当前页 */
  const refresh = (path: string) => {
    if (!refreshCachedPage(path) && path === activeKeyState)
      refreshCurrentPage()
  }

  return {
    tabsState,
    activeKeyState,
    activate,
    close,
    closeOthers,
    closeSide,
    closeAll,
    refresh,
  }
}
