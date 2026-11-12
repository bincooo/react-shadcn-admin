import { lazy, Suspense, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Palette } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'
import { Separator } from '@repo/ui/components/separator'
import { FullPageLoader } from '@/components/common/header'
import { LoginPreview } from '@/components/theme/previews'
import {
  LOGIN_STYLE_OPTIONS,
  MODE_OPTIONS,
  type LoginStyle,
} from '@/config/theme'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme'
import { SplitLogin } from './modules/split'

/**
 * 默认风格（split）直接打进首屏 chunk，避免登录页出现占位闪烁；
 * 其余 5 种风格按需加载：glass / slider / bubble 会带入 motion（≈40KB gzip），
 * 只有用户真的选了这些风格才值得付这笔体积。
 */
const LOGIN_RENDERERS: Record<LoginStyle, ComponentType> = {
  split: SplitLogin,
  glass: lazy(() =>
    import('./modules/glass').then((m) => ({ default: m.GlassLogin })),
  ),
  slider: lazy(() =>
    import('./modules/slider').then((m) => ({ default: m.SliderLogin })),
  ),
  bubble: lazy(() =>
    import('./modules/bubble').then((m) => ({ default: m.BubbleLogin })),
  ),
  immersive: lazy(() =>
    import('./modules/immersive').then((m) => ({ default: m.ImmersiveLogin })),
  ),
  dotgrid: lazy(() =>
    import('./modules/dot-grid').then((m) => ({ default: m.DotGridLogin })),
  ),
}

export default function LoginPage() {
  const loginStyle = useThemeStore((s) => s.loginStyle)
  // 持久化数据可能是旧的/脏的 loginStyle，保留兜底
  const Renderer = LOGIN_RENDERERS[loginStyle] ?? LOGIN_RENDERERS.split
  return (
    <div className="relative">
      <Suspense fallback={<FullPageLoader />}>
        <Renderer />
      </Suspense>
      {/* 右上角悬浮：未登录也能切换主题模式与登录风格 */}
      <div className="fixed top-4 right-4 z-50">
        <LoginAppearance />
      </div>
    </div>
  )
}

/* ------------------------------- 外观切换 ------------------------------- */

/** 这些登录风格的背景是深色，触发按钮需要反色才看得见 */
const DARK_BG_STYLES: ReadonlySet<LoginStyle> = new Set(['glass', 'immersive'])

/**
 * 登录页右上角的外观切换：主题模式（明亮 / 黑暗 / 自动）+ 登录风格。
 * 未登录时也能改，配置与主题面板共用同一份 store，登录后自动延续。
 */
function LoginAppearance() {
  const { t } = useTranslation()
  const [openState, setOpen] = useState(false)
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const loginStyle = useThemeStore((s) => s.loginStyle)
  const setLoginStyle = useThemeStore((s) => s.setLoginStyle)
  const onDark = DARK_BG_STYLES.has(loginStyle)

  return (
    <Popover open={openState} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className={cn(
              'rounded-full backdrop-blur-sm',
              onDark
                ? 'text-white/80 hover:bg-white/15 hover:text-white'
                : 'text-muted-foreground hover:bg-foreground/4 hover:text-foreground',
            )}
            aria-label={t('login.appearance')}
          />
        }
      >
        <Palette />
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t('theme.themeMode')}
          </p>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = mode === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={active}
                  className={cn(
                    'flex h-8 items-center justify-center gap-1.5 rounded-md text-[12.5px] transition-colors outline-none',
                    'focus-visible:ring-2 focus-visible:ring-ring/50',
                    active
                      ? 'bg-background font-medium text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5" />
                  {t(label)}
                </button>
              )
            })}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t('theme.loginStyle')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {LOGIN_STYLE_OPTIONS.map((option) => (
              <StyleTile
                key={option.value}
                value={option.value}
                selected={loginStyle === option.value}
                label={t(option.label)}
                onSelect={() => setLoginStyle(option.value)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** 风格缩略图：复用主题面板的 LoginPreview，尺寸收窄以适配 3 列 */
function StyleTile({
  value,
  selected,
  label,
  onSelect,
}: {
  value: LoginStyle
  selected: boolean
  label: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={label}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border p-1.5 transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40',
      )}
    >
      <span className="w-full overflow-hidden rounded-md">
        <LoginPreview variant={value} />
      </span>
      <span
        className={cn(
          'w-full truncate text-center text-[11px]',
          selected ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
    </button>
  )
}
