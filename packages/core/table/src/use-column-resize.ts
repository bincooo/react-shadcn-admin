import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import type { Header, Table } from '@tanstack/react-table'

/**
 * 列宽拖拽。
 *
 * 拖拽过程只更新 DOM 上的引导线（不触发 React 渲染），松手时一次性写入
 * `columnSizing`；避免每帧 setState 带来的整表重渲染。
 */
export function useColumnResize<TData>({
  table,
  scrollContainerRef,
}: {
  table: Table<TData>
  scrollContainerRef: RefObject<HTMLDivElement | null>
}) {
  const cleanupRef = useRef<(() => void) | null>(null)

  // 卸载时终止仍在进行的拖拽，移除全局监听与引导线
  useEffect(() => () => cleanupRef.current?.(), [])

  return useCallback(
    (
      event: ReactMouseEvent<HTMLElement> | ReactTouchEvent<HTMLElement>,
      header: Header<TData, unknown>,
    ) => {
      if ('button' in event && event.button !== 0) return
      const container = scrollContainerRef.current
      const boundaryCell = event.currentTarget.closest('th, td')
      const tableElement = boundaryCell?.closest('table')
      if (!container || !boundaryCell || !tableElement) return
      event.stopPropagation()
      if (event.cancelable) event.preventDefault()
      cleanupRef.current?.()

      const touch = 'touches' in event
      const startX = touch ? event.touches[0]?.clientX : event.clientX
      if (startX === undefined) return
      const initialSize = header.column.getSize()
      const min = header.column.columnDef.minSize ?? 20
      const max = header.column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
      const initialRight = boundaryCell.getBoundingClientRect().right
      let nextSize = initialSize
      let lastX = startX
      // 是否真正拖动过：未移动的单击交给拖拽热区自身的 onClick 处理
      let moved = false
      const guide = document.createElement('div')
      guide.className = 'tanstack-table-resize-guide'
      guide.setAttribute('aria-hidden', 'true')
      const label = document.createElement('span')
      label.className = 'tanstack-table-resize-guide-label'
      guide.appendChild(label)
      container.appendChild(guide)
      document.body.classList.add('tanstack-table-resizing')

      const update = () => {
        nextSize = Math.min(max, Math.max(min, initialSize + lastX - startX))
        const containerRect = container.getBoundingClientRect()
        const tableRect = tableElement.getBoundingClientRect()
        guide.style.left = `${initialRight + nextSize - initialSize - containerRect.left + container.scrollLeft}px`
        guide.style.top = `${tableRect.top - containerRect.top + container.scrollTop}px`
        guide.style.height = `${tableRect.height}px`
        label.textContent = `${Math.round(nextSize)} px`
      }
      const mouseMove = (e: MouseEvent) => {
        lastX = e.clientX
        if (e.clientX !== startX) moved = true
        update()
      }
      const touchMove = (e: TouchEvent) => {
        if (e.touches[0]) {
          lastX = e.touches[0].clientX
          if (e.touches[0].clientX !== startX) moved = true
          update()
        }
        if (e.cancelable) e.preventDefault()
      }
      const cleanup = () => {
        document.removeEventListener('mousemove', mouseMove)
        document.removeEventListener('mouseup', mouseUp)
        document.removeEventListener('touchmove', touchMove)
        document.removeEventListener('touchend', touchEnd)
        document.removeEventListener('touchcancel', cancel)
        document.removeEventListener('keydown', keyDown)
        container.removeEventListener('scroll', update)
        guide.remove()
        document.body.classList.remove('tanstack-table-resizing')
        if (cleanupRef.current === cleanup) cleanupRef.current = null
      }
      const commit = () => {
        cleanup()
        if (nextSize !== initialSize) {
          table.setColumnSizing((old) => ({
            ...old,
            [header.column.id]: nextSize,
          }))
        }
      }
      /**
       * 拖拽结束后浏览器仍会派发一次 click；鼠标已移出拖拽热区时，
       * click 会落在表头单元格上误触排序。在捕获阶段吞掉这次 click。
       */
      const suppressClickAfterResize = () => {
        let timer: number | undefined
        const suppress = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation()
          clickEvent.preventDefault()
          document.removeEventListener('click', suppress, true)
          if (timer !== undefined) window.clearTimeout(timer)
        }
        // 兜底：没有产生 click 时自动解绑，避免影响后续正常点击
        timer = window.setTimeout(() => {
          document.removeEventListener('click', suppress, true)
        }, 500)
        document.addEventListener('click', suppress, true)
      }
      const mouseUp = (e: MouseEvent) => {
        lastX = e.clientX
        if (e.clientX !== startX) moved = true
        update()
        commit()
        if (moved) suppressClickAfterResize()
      }
      const touchEnd = (e: TouchEvent) => {
        if (e.changedTouches[0]) {
          lastX = e.changedTouches[0].clientX
          if (e.changedTouches[0].clientX !== startX) moved = true
          update()
        }
        commit()
        if (moved) suppressClickAfterResize()
      }
      const cancel = () => cleanup()
      const keyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') cancel()
      }
      cleanupRef.current = cleanup
      document.addEventListener('mousemove', mouseMove)
      document.addEventListener('mouseup', mouseUp)
      document.addEventListener('touchmove', touchMove, { passive: false })
      document.addEventListener('touchend', touchEnd)
      document.addEventListener('touchcancel', cancel)
      document.addEventListener('keydown', keyDown)
      container.addEventListener('scroll', update)
      update()
    },
    [scrollContainerRef, table],
  )
}
