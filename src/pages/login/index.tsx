import { lazy, Suspense, type ComponentType } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { useThemeStore } from '@/store/theme'
import type { LoginStyle } from '@/config/theme'
import { SplitLogin } from './modules/split-login'
import { LoginAppearance } from './modules/appearance'

/**
 * 默认风格（split）直接打进首屏 chunk，避免登录页出现占位闪烁；
 * 其余 5 种风格按需加载：glass / slider / bubble 会带入 motion（≈40KB gzip），
 * 只有用户真的选了这些风格才值得付这笔体积。
 */
const LOGIN_RENDERERS: Record<LoginStyle, ComponentType> = {
  split: SplitLogin,
  glass: lazy(() =>
    import('./modules/glass-login').then((m) => ({ default: m.GlassLogin })),
  ),
  slider: lazy(() =>
    import('./modules/slider-login').then((m) => ({
      default: m.SliderLogin,
    })),
  ),
  bubble: lazy(() =>
    import('./modules/bubble-login').then((m) => ({
      default: m.BubbleLogin,
    })),
  ),
  immersive: lazy(() =>
    import('./modules/immersive-login').then((m) => ({
      default: m.ImmersiveLogin,
    })),
  ),
  dotgrid: lazy(() =>
    import('./modules/dot-grid-login').then((m) => ({
      default: m.DotGridLogin,
    })),
  ),
}

/** 懒加载风格的占位：保持背景色，避免白屏跳变 */
function LoginFallback() {
  return (
    <div className="grid h-dvh place-items-center bg-background">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}

export default function LoginPage() {
  const loginStyle = useThemeStore((s) => s.loginStyle)
  // 持久化数据可能是旧的/脏的 loginStyle，保留兜底
  const Renderer = LOGIN_RENDERERS[loginStyle] ?? LOGIN_RENDERERS.split
  return (
    <div className="relative">
      <Suspense fallback={<LoginFallback />}>
        <Renderer />
      </Suspense>
      {/* 右上角悬浮：未登录也能切换主题模式与登录风格 */}
      <div className="fixed top-4 right-4 z-50">
        <LoginAppearance />
      </div>
    </div>
  )
}
