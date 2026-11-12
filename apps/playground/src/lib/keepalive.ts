/**
 * 页面缓存（keep-alive）的基础设施：实例持有 + 缓存清理动作。
 *
 * 依赖应用级 store（`store/app`），属于有状态基建，与纯函数工具并列放在 `lib/`。
 */
import type { KeepAliveRef } from 'keepalive-for-react'
import { useAppStore } from '@/store/app'

/**
 * 持有 KeepAlive 实例的引用，供顶栏刷新 / 页签关闭时清理缓存使用。
 */
export const keepAliveHolder: { current: KeepAliveRef | null } = {
  current: null,
}

/** 刷新指定路由的缓存页；未启用缓存时返回 false 由调用方兜底 */
export function refreshCachedPage(pathname: string): boolean {
  const ref = keepAliveHolder.current
  if (!ref) return false
  ref.refresh(pathname)
  return true
}

/**
 * 刷新当前页：优先刷新 KeepAlive 缓存，未启用缓存时回退到重挂载。
 * 顶栏刷新按钮与页签栏共用。
 */
export function refreshCurrentPage() {
  const { activeKey, refresh } = useAppStore.getState()
  if (!refreshCachedPage(activeKey)) refresh()
}

/** 关闭页签时销毁对应缓存 */
export function destroyCachedPage(pathname: string) {
  void keepAliveHolder.current?.destroy(pathname)
}
