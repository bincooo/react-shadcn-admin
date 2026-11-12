import { useId, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Switch } from '@repo/ui/components/switch'
import { Input } from '@repo/ui/components/input'
import { Slider } from '@repo/ui/components/slider'
import { cn } from '@/lib/utils'

/** 行首的图标 + 标题 + 说明，ToggleRow / TextRow 共用 */
function RowHeading({
  icon: Icon,
  label,
  description,
  truncate,
}: {
  icon: LucideIcon
  label: string
  description?: string
  truncate?: boolean
}) {
  return (
    <>
      <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-foreground">
          {label}
        </span>
        {description && (
          <span
            className={cn(
              'block text-[10.5px] text-muted-foreground',
              truncate && 'truncate',
            )}
          >
            {description}
          </span>
        )}
      </span>
    </>
  )
}

/** 面板通用开关行：标题 + 说明 + 开关，禁用时整行降透明度 */
export function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  icon: LucideIcon
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** 禁用（如黑暗模式下的暗色侧栏）：开关不可切换，整行置灰 */
  disabled?: boolean
}) {
  // label / switch 共享 id：点击整行与屏幕阅读器都能定位到同一个开关
  const controlId = useId()

  return (
    <label
      htmlFor={controlId}
      className={cn(
        'flex items-center gap-3 transition-colors',
        'rounded-xl border border-border/70 bg-card px-3 py-2.5',
        disabled ? 'opacity-55' : 'cursor-pointer hover:border-primary/25',
      )}
    >
      <RowHeading
        icon={Icon}
        label={label}
        description={description}
        truncate
      />
      <Switch
        id={controlId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </label>
  )
}

/** 文本输入行：标题 + 说明 + 输入框，用于水印 / 版权等自定义文案 */
export function TextRow({
  icon: Icon,
  label,
  description,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  icon: LucideIcon
  label: string
  description?: string
  value: string
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5">
      <div className="flex items-start gap-3">
        <RowHeading
          icon={Icon}
          label={label}
          description={description}
          truncate
        />
      </div>
      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={60}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
      />
    </div>
  )
}

/** 面板通用数值滑条：显示当前值与单位，拖动时实时预览 */
export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium">{label}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  )
}

/** 分段选择器内的选项：选中 / 禁用外观统一，尺寸与光标由调用方补充 */
export function SegmentedOption({
  active,
  disabled = false,
  onClick,
  className,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg font-medium transition-colors',
        active ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground',
        !disabled && !active && 'hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}
