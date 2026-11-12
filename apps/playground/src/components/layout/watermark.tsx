import { useMemo } from 'react'
import { useThemeStore } from '@/store/theme'

/**
 * 简易文字水印层，铺满内容区。
 * 文字优先取主题配置里的 watermarkText，留空时回退到当前登录用户名。
 */
export function Watermark({ fallbackText }: { fallbackText?: string }) {
  const enabled = useThemeStore((s) => s.watermark)
  const watermarkText = useThemeStore((s) => s.watermarkText)

  const label = watermarkText.trim() || fallbackText?.trim() || 'React Admin'

  const bg = useMemo(() => {
    // SVG 里不能直接放未转义的 & < > 等字符，统一转义后再编码
    const escaped = label
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130"><text x="14" y="70" font-size="13" fill="currentColor" fill-opacity="0.07" transform="rotate(-18 100 65)">${escaped}</text></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }, [label])

  if (!enabled) return null

  return (
    <div
      aria-hidden
      className="watermark-layer text-foreground"
      style={{ backgroundImage: bg }}
    />
  )
}
