import { useCallback, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_MIN_WIDTH,
  type ColumnEntry,
} from './grid-table-model'

interface GridTableResizeOptions<TData extends object> {
  leaves: Map<string, ColumnEntry<TData>>
  /** 首次渲染的列宽（来自列定义与默认值） */
  initialWidths: Record<string, number>
}

/** 列宽拖拽：拖动表头右侧手柄改宽，双击恢复列定义里的宽度。 */
export function useGridTableColumnResize<TData extends object>({
  leaves,
  initialWidths,
}: GridTableResizeOptions<TData>) {
  const [widthsState, setWidths] = useState(initialWidths)
  const [resizingIdState, setResizingId] = useState<string | null>(null)
  const resizeRef = useRef<{
    startX: number
    startWidth: number
    minWidth: number
  } | null>(null)

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>, id: string) => {
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      resizeRef.current = {
        startX: event.clientX,
        startWidth: widthsState[id] ?? DEFAULT_COLUMN_WIDTH,
        minWidth: leaves.get(id)?.column.minWidth ?? DEFAULT_MIN_WIDTH,
      }
      setResizingId(id)
    },
    [leaves, widthsState],
  )

  const resizeColumn = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      const resize = resizeRef.current
      if (!resize || !resizingIdState) return
      const width = Math.max(
        resize.minWidth,
        Math.round(resize.startWidth + event.clientX - resize.startX),
      )
      setWidths((prev) =>
        prev[resizingIdState] === width
          ? prev
          : { ...prev, [resizingIdState]: width },
      )
    },
    [resizingIdState],
  )

  const stopResize = useCallback(() => {
    resizeRef.current = null
    setResizingId(null)
  }, [])

  const resetColumnWidth = useCallback(
    (id: string) => {
      const width = leaves.get(id)?.column.width ?? DEFAULT_COLUMN_WIDTH
      setWidths((prev) => ({ ...prev, [id]: width }))
    },
    [leaves],
  )

  return {
    widthsState,
    resizingIdState,
    startResize,
    resizeColumn,
    stopResize,
    resetColumnWidth,
  }
}
