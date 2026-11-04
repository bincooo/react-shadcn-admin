import { Spinner } from '@/components/ui/spinner'

/** 整页加载占位：懒加载 chunk 期间显示，保持背景色避免白屏 */
export function FullPageLoader() {
  return (
    <div className="grid h-dvh place-items-center bg-background text-muted-foreground">
      <Spinner className="size-6" />
    </div>
  )
}
