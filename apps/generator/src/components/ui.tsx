import type { ReactNode, SelectHTMLAttributes } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { Input } from '@repo/ui/components/input'
import { cn } from '@repo/ui/lib/utils'

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-baseline justify-between gap-1.5">
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {hint ? (
          <span className="truncate text-[10px] text-muted-foreground/70">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export function TextInput({
  className,
  mono,
  ...props
}: React.ComponentProps<'input'> & { mono?: boolean }) {
  return (
    <Input
      className={cn(
        'h-8 text-[12px] md:text-[12px]',
        mono && 'font-mono',
        className,
      )}
      {...props}
    />
  )
}

export function NativeSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2 pr-7 text-[12px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'block size-2.5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[16px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  )
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-card', className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-card-foreground">
            {title}
          </h2>
          {description ? (
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="p-2.5">{children}</div>
    </section>
  )
}

const BADGE_TONES = {
  muted: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
} as const

export function Badge({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: keyof typeof BADGE_TONES
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full h-6 px-1.5 py-0 text-[10px] leading-4 font-medium',
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
      <div className="max-w-sm space-y-1.5">
        <p className="text-[13px] font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  )
}
