import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TabItem {
  key: string
  path: string
  title: string
  /** 固定标签（不可关闭） */
  affix?: boolean
}

interface AppState {
  collapsed: boolean
  /** 双栏 / 分栏布局的第二栏收起状态 */
  secondCollapsed: boolean
  tabs: TabItem[]
  activeKey: string
  themePanelOpen: boolean
  /** 用于强制刷新当前路由 */
  refreshKey: number
  searchOpen: boolean

  toggleCollapsed: () => void
  toggleSecondCollapsed: () => void
  setThemePanelOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  addTab: (tab: TabItem) => void
  setActiveTab: (key: string) => void
  closeTab: (key: string) => TabItem | null
  closeOthers: (key: string) => void
  closeLeft: (key: string) => void
  closeRight: (key: string) => void
  closeAll: () => TabItem[]
  refresh: () => void
}

const HOME_TAB: TabItem = {
  key: '/dashboard',
  path: '/dashboard',
  title: 'menu.workspace',
  affix: true,
}

/** 关闭 `key` 左侧或右侧的页签；固定页签始终保留 */
function closeSide(tabs: TabItem[], key: string, side: 'left' | 'right') {
  const index = tabs.findIndex((tab) => tab.key === key)
  return tabs.filter(
    (tab, i) => tab.affix || (side === 'left' ? i >= index : i <= index),
  )
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      collapsed: false,
      secondCollapsed: false,
      tabs: [HOME_TAB],
      activeKey: HOME_TAB.key,
      themePanelOpen: false,
      refreshKey: 0,
      searchOpen: false,

      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      toggleSecondCollapsed: () =>
        set((s) => ({ secondCollapsed: !s.secondCollapsed })),
      setThemePanelOpen: (themePanelOpen) => set({ themePanelOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),

      addTab: (tab) =>
        set((state) => {
          const exists = state.tabs.some((t) => t.key === tab.key)
          return {
            tabs: exists ? state.tabs : [...state.tabs, tab],
            activeKey: tab.key,
          }
        }),

      setActiveTab: (activeKey) => set({ activeKey }),

      closeTab: (key) => {
        const { tabs, activeKey } = get()
        const index = tabs.findIndex((t) => t.key === key)
        const target = tabs[index]
        if (!target || target.affix) return null
        const nextTabs = tabs.filter((t) => t.key !== key)
        const nextActive =
          activeKey === key
            ? (nextTabs[Math.min(index, nextTabs.length - 1)] ?? nextTabs[0])
            : nextTabs.find((t) => t.key === activeKey)
        set({ tabs: nextTabs, activeKey: nextActive?.key ?? '' })
        return activeKey === key ? (nextActive ?? null) : null
      },

      closeOthers: (key) =>
        set((state) => ({
          tabs: state.tabs.filter((t) => t.key === key || t.affix),
          activeKey: key,
        })),

      closeLeft: (key) =>
        set((state) => ({ tabs: closeSide(state.tabs, key, 'left') })),

      closeRight: (key) =>
        set((state) => ({ tabs: closeSide(state.tabs, key, 'right') })),

      closeAll: () => {
        const affixTabs = get().tabs.filter((t) => t.affix)
        set({ tabs: affixTabs, activeKey: affixTabs[0]?.key ?? '' })
        return affixTabs
      },

      refresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
    }),
    {
      name: 'react-admin-app',
      partialize: ({ collapsed, secondCollapsed, tabs, activeKey }) => ({
        collapsed,
        secondCollapsed,
        tabs,
        activeKey,
      }),
    },
  ),
)
