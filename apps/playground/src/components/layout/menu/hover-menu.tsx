import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@repo/ui/components/hover-card'

const CloseFloatingMenuContext = createContext<() => void>(() => {})

/** Close the nearest hover menu; links outside a flyout receive a no-op. */
export function useCloseFloatingMenu() {
  return use(CloseFloatingMenuContext)
}

export { CloseFloatingMenuContext }

/**
 * 悬停展开的浮层菜单：用 Base UI 的 PreviewCard（本地封装为 HoverCard）实现。
 *
 * 两层细节在这里处理：
 *  1. 悬停开、移出关，用 openDelay / closeDelay 抹平指针在缝隙里的抖动；
 *  2. 子浮层是另一个 Portal，指针移进去时 Base UI 会判定「离开本层」并关闭整条路径，
 *     所以子层打开期间把本层强制保持打开（open = hovered || childOpen）。
 */
const ChildOpenContext = createContext<(id: symbol, open: boolean) => void>(
  () => {},
)

/** 悬浮子菜单：指针离开延迟关闭，避免斜向移动时误关；键盘 Esc 直接关闭 */
export function HoverMenu({
  trigger,
  side = 'right',
  align = 'start',
  sideOffset = 4,
  openDelay = 80,
  closeDelay = 120,
  className,
  children,
}: {
  /** 触发元素：单个可接收 ref / 事件的元素（button、NavLink 等） */
  trigger: ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  openDelay?: number
  closeDelay?: number
  className?: string
  children: ReactNode
}) {
  const reportToParent = use(ChildOpenContext)
  const closeParentMenu = useCloseFloatingMenu()
  const [hoveredState, setHovered] = useState(false)
  const [childOpenState, setChildOpen] = useState(false)
  const [dismissedState, setDismissed] = useState(false)

  const [menuId] = useState(() => Symbol('hover-menu'))
  const openChildren = useRef(new Set<symbol>())
  const open = hoveredState || childOpenState

  // Multiple sibling portals may overlap during their close delays.
  const reportChildOpen = useCallback((id: symbol, childOpen: boolean) => {
    if (childOpen) openChildren.current.add(id)
    else openChildren.current.delete(id)
    setChildOpen(openChildren.current.size > 0)
  }, [])

  // Keep every ancestor open while this portal is open, including on unmount.
  useEffect(() => {
    if (!open) return
    reportToParent(menuId, true)
    return () => reportToParent(menuId, false)
  }, [menuId, open, reportToParent])

  const closeMenu = useCallback(() => {
    setDismissed(true)
    setHovered(false)
    setChildOpen(false)
    closeParentMenu()
  }, [closeParentMenu])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && dismissedState) return
      setHovered(open)
    },
    [dismissedState],
  )

  // After a click closes the menu, ignore hover re-open until the pointer moves.
  useEffect(() => {
    if (!dismissedState) return
    const releaseDismissal = () => setDismissed(false)
    document.addEventListener('pointermove', releaseDismissal, { once: true })
    return () => document.removeEventListener('pointermove', releaseDismissal)
  }, [dismissedState])

  return (
    <HoverCard open={open} onOpenChange={handleOpenChange}>
      <HoverCardTrigger
        render={trigger}
        delay={openDelay}
        closeDelay={closeDelay}
      />
      <HoverCardContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={className}
      >
        <ChildOpenContext.Provider value={reportChildOpen}>
          <CloseFloatingMenuContext.Provider value={closeMenu}>
            {children}
          </CloseFloatingMenuContext.Provider>
        </ChildOpenContext.Provider>
      </HoverCardContent>
    </HoverCard>
  )
}
