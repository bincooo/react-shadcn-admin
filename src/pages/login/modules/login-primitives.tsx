import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Eye,
  EyeOff,
  Fingerprint,
  Github,
  Loader2,
  Mail,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Shared visual primitives used by the login page variants. */
/* ------------------------------- 装饰片段 ------------------------------- */

/** 品牌图标方块 */
export function BrandMark({
  className,
  iconClassName,
}: {
  className: string
  iconClassName?: string
}) {
  return (
    <span className={cn('grid place-items-center', className)}>
      <Box className={iconClassName ?? 'size-5'} />
    </span>
  )
}

/** 白色网格叠层（装饰用，透明度由调用方给） */
export function GridOverlay({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]',
        className,
      )}
    />
  )
}

/**
 * 深色品牌区的文字/装饰遮罩：主色在亮色模式下会偏亮，
 * 叠一层暗角保证白色文案始终有足够对比度。
 */
export function BrandShade() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,24,0.55),rgba(4,10,24,0.35)_45%,rgba(4,10,24,0.62))]"
    />
  )
}

/* ------------------------------- 表单片段 ------------------------------- */

/** 表单字段：标签 + 前置图标 + 输入框 + 可选尾部插槽 */
export function AuthField({
  id,
  label,
  icon: Icon,
  iconClassName,
  className,
  labelClassName,
  inputClassName,
  trailing,
  ...inputProps
}: {
  id?: string
  label: string
  icon?: LucideIcon
  iconClassName?: string
  className?: string
  labelClassName?: string
  inputClassName?: string
  trailing?: ReactNode
} & Omit<ComponentProps<'input'>, 'className'>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <div className="relative">
        {Icon ? (
          <Icon
            className={cn(
              'pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground',
              iconClassName,
            )}
          />
        ) : null}
        <Input
          id={id}
          className={cn('h-10', Icon && 'pl-9', inputClassName)}
          {...inputProps}
        />
        {trailing}
      </div>
    </div>
  )
}

/** 密码可见性切换 */
export function PasswordToggle({
  show,
  onToggle,
  className,
}: {
  show: boolean
  onToggle: () => void
  className: string
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? t('login.hidePassword') : t('login.showPassword')}
      className={className}
    >
      {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </button>
  )
}

/** 提交按钮：加载时统一切换为转圈图标 + 提交中文案 */
export function SubmitButton({
  loading,
  loadingLabel,
  icon,
  spinner = true,
  className,
  children,
}: {
  loading: boolean
  loadingLabel: string
  icon?: ReactNode
  spinner?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Button type="submit" disabled={loading} className={className}>
      {loading
        ? spinner && (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          )
        : icon}
      {loading ? loadingLabel : children}
    </Button>
  )
}

/** 登录 / 注册模式切换链接 */
export function ModeSwitch({
  label,
  onClick,
  tone = 'light',
  className,
}: {
  label: string
  onClick: () => void
  tone?: 'light' | 'dark'
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <p className={cn('text-center text-[12.5px]', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'font-medium hover:underline',
          dark ? 'text-white/80' : 'text-primary',
        )}
      >
        {label}
      </button>
    </p>
  )
}

/** 第三方登录入口（未接入，统一提示不可用） */
export function ThirdParty({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark'
  className?: string
}) {
  const { t } = useTranslation()
  const dark = tone === 'dark'
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn('h-px flex-1', dark ? 'bg-white/20' : 'bg-border')}
        />
        <span
          className={cn(
            'text-[11px]',
            dark ? 'text-white/60' : 'text-muted-foreground',
          )}
        >
          {t('login.thirdParty')}
        </span>
        <span
          className={cn('h-px flex-1', dark ? 'bg-white/20' : 'bg-border')}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[Github, Mail, Fingerprint].map((Icon, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toast.info(t('login.thirdPartyUnavailable'))}
            className={cn(
              'flex h-9 items-center justify-center rounded-lg border transition-colors',
              dark
                ? 'border-white/25 text-white/80 hover:bg-white/10'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
    </div>
  )
}
