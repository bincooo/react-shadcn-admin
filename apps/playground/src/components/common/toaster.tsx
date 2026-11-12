import type { CSSProperties } from 'react'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useResolvedMode } from '@/lib/theme-runtime'

/**
 * 应用级 toast 容器。
 *
 * 归属应用而不是 `@repo/ui`：主题解析依赖应用的 `theme-runtime`，
 * 组件库只提供无主题依赖的基础组件。
 */
export function Toaster(props: ToasterProps) {
  const theme = useResolvedMode()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  )
}
