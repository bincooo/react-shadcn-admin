import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 页签横向滚动：跟踪左右可滚动状态，并在激活页签变化时滚入可视区域。
 * `tabCount` 变化时重新检测（新增页签 / 关闭页签都会改变内容宽度）。
 */
export function useTabScrollSync(activeKey: string, tabCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeftState, setCanScrollLeft] = useState(false)
  const [canScrollRightState, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateScrollState, tabCount])

  // 激活页签变化时滚动到可视区域，新增页签不会藏在右侧
  useEffect(() => {
    scrollRef.current
      ?.querySelector<HTMLElement>('[data-tab-active="true"]')
      ?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      })
  }, [activeKey, tabCount])

  const scrollBy = (direction: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({
      left: direction * Math.max(el.clientWidth * 0.7, 160),
      behavior: 'smooth',
    })
  }

  return {
    scrollRef,
    canScrollLeftState,
    canScrollRightState,
    updateScrollState,
    scrollBy,
  }
}
