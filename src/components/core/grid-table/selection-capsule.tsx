import { useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface SelectionCapsuleProps {
  count: number
  actions?: ReactNode
  getContainer?: () => HTMLElement | null
  onClear: () => void
}

/** 悬浮的批量操作胶囊：水平居中于 portal 容器，容器由调用方指定。 */
export function SelectionCapsule({
  count,
  actions,
  getContainer,
  onClear,
}: SelectionCapsuleProps) {
  const { t } = useTranslation()
  const container = getContainer?.() ?? document.body
  // fixed 定位以视口为基准,而容器常因侧边栏偏移:测量容器盒,让胶囊对齐容器而非视口
  const [containerBoxState, setContainerBoxState] = useState({
    left: 0,
    width: 0,
  })

  useLayoutEffect(() => {
    const syncContainerBox = () =>
      setContainerBoxState({
        left: container.getBoundingClientRect().left,
        width: container.clientWidth,
      })
    syncContainerBox()
    const observer = new ResizeObserver(syncContainerBox)
    observer.observe(container)
    return () => observer.disconnect()
  }, [container])

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-6 z-40 flex justify-center px-4"
      style={{ left: containerBoxState.left, width: containerBoxState.width }}
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border bg-background px-3 py-2 shadow-lg">
        <span
          aria-live="polite"
          aria-atomic="true"
          className="shrink-0 text-[12.5px] font-medium"
        >
          {t('table.selected', { count })}
        </span>
        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
        <Button
          className="rounded-full"
          variant="ghost"
          size="sm"
          onClick={onClear}
        >
          {t('table.clear')}
        </Button>
        {actions}
      </div>
    </div>,
    container,
  )
}
