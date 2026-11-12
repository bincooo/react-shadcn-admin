import { useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { KeepAlive, useKeepAliveRef } from 'keepalive-for-react'
import { cn } from '@/lib/utils'
import { keepAliveHolder } from '@/lib/keepalive'
import {
  clearDrawerNavigation,
  isDrawerNavigation,
} from '@/lib/page-transition'
import { useAppStore } from '@/store/app'
import { useThemeStore } from '@/store/theme'

/**
 * 路由出口：keepAlive 开启时用 KeepAlive 缓存页面状态，关闭时直接渲染。
 * 页面切换动画与缓存互斥处理：抽屉式布局不做转场，避免变换影响固定定位。
 */
export function OutletWithKeepAlive() {
  const location = useLocation()
  const outlet = useOutlet()
  const keepAlive = useThemeStore((s) => s.keepAlive)
  const pageTransition = useThemeStore((s) => s.pageTransition)
  const refreshKey = useAppStore((s) => s.refreshKey)
  const aliveRef = useKeepAliveRef()

  useEffect(() => {
    keepAliveHolder.current = aliveRef.current
    return () => {
      keepAliveHolder.current = null
    }
  }, [aliveRef])

  // 抽屉发起的导航已在退场动画里完成转场，不再叠加页面入场（否则两段动画之间会空白）
  const fromDrawer = isDrawerNavigation(location.pathname)
  const animate = pageTransition && !fromDrawer

  // 标记只对本次挂载生效，路由稳定后撤下，避免影响后续导航
  useEffect(() => {
    if (fromDrawer) clearDrawerNavigation()
  }, [fromDrawer])

  const content = (
    <div
      key={`${location.pathname}-${refreshKey}`}
      className={cn(
        'flex h-full min-h-0 flex-1 flex-col',
        animate &&
          'page-stagger motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-[6px] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,0.61,0.36,1)]',
      )}
    >
      {outlet}
    </div>
  )

  if (!keepAlive) return content

  return (
    <KeepAlive
      aliveRef={aliveRef}
      activeCacheKey={location.pathname}
      max={18}
      transition={false}
      containerClassName="keep-alive-render h-full min-h-0 flex-1"
      cacheNodeClassName="cache-component flex h-full min-h-0 flex-col"
    >
      {content}
    </KeepAlive>
  )
}
