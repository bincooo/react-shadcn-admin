import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { pinyin as PinyinFn } from 'pinyin-pro'
import { routeEntries } from '@/router/modules'
import {
  buildRouteSearchEntry,
  matchesRouteSearch,
  type RouteSearchEntry,
} from './route-search-index'

/**
 * 全局页面搜索的数据与交互状态。
 * 拼音库体积较大（≈200KB），面板首次打开时才按需加载。
 */
export function useRouteSearchSync(
  open: boolean,
  setOpen: (open: boolean) => void,
) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [queryState, setQuery] = useState('')
  const [activeIndexState, setActiveIndex] = useState(0)
  const listId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [pinyinState, setPinyin] = useState<typeof PinyinFn | null>(null)

  useEffect(() => {
    if (!open || pinyinState) return
    let cancelled = false
    void import('pinyin-pro').then((mod) => {
      if (!cancelled) setPinyin(() => mod.pinyin)
    })
    return () => {
      cancelled = true
    }
  }, [open, pinyinState])

  const items = useMemo<RouteSearchEntry[]>(
    () =>
      routeEntries.map((route) => {
        const label = t(route.title)
        const group = route.breadcrumb
          .slice(0, -1)
          .map((key) => t(key))
          .join(' / ')
        return buildRouteSearchEntry({
          route,
          label,
          group,
          pinyin: pinyinState,
        })
      }),
    [t, pinyinState],
  )

  // 筛选独立成一步：只有关键字变化时才重新过滤，索引不变则不重算
  const results = useMemo(
    () => items.filter((entry) => matchesRouteSearch(entry, queryState)),
    [items, queryState],
  )

  const activeIndex = Math.min(activeIndexState, results.length - 1)

  /** 输入或关闭面板时复位，下一次打开保持干净的搜索状态。 */
  const updateQuery = (value: string) => {
    setQuery(value)
    setActiveIndex(0)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) updateQuery('')
    setOpen(next)
  }

  const moveActive = (delta: -1 | 1) => {
    const next = Math.max(0, Math.min(activeIndex + delta, results.length - 1))
    setActiveIndex(next)
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }

  const select = (index: number) => {
    const entry = results[index]
    if (!entry) return
    handleOpenChange(false)
    navigate(entry.route.path)
  }

  return {
    listId,
    listRef,
    queryState,
    results,
    activeIndex,
    setActiveIndex,
    updateQuery,
    handleOpenChange,
    moveActive,
    select,
  }
}
