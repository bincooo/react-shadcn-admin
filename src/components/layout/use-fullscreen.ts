import { useEffect, useState } from 'react'

/**
 * 全屏切换：跟随浏览器真实的全屏状态（含 Esc / 系统手势退出）。
 */
export function useFullscreen() {
  const [fullscreenState, setFullscreen] = useState(
    () =>
      typeof document !== 'undefined' && Boolean(document.fullscreenElement),
  )

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggle = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen()
    }
  }

  return { fullscreenState, toggle }
}
