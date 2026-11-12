import { CheckIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import type { LayoutStyle, LoginStyle } from '@/config/theme'

/** 预览卡片外框：选中态蓝框 + 右上角对勾 */
export function PreviewTile({
  selected,
  label,
  description,
  onClick,
  children,
}: {
  selected: boolean
  label: string
  description?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full flex-col items-center gap-2 rounded-xl border p-2.5 pt-3 transition-colors duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40',
      )}
    >
      {selected && (
        <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-2.5" strokeWidth={3.5} />
        </span>
      )}
      <div
        className={cn(
          'flex w-full items-center justify-center rounded-lg border p-2 transition-colors',
          selected
            ? 'border-primary/25 bg-[color-mix(in_oklab,var(--primary)_6%,transparent)]'
            : 'border-border bg-muted/40 group-hover:border-primary/20',
        )}
      >
        {children}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            'text-[13px] font-medium transition-colors',
            selected ? 'text-primary' : 'text-foreground/80',
          )}
        >
          {label}
        </span>
        {description && (
          <span className="line-clamp-2 px-1 text-center text-[11px] leading-tight text-muted-foreground">
            {description}
          </span>
        )}
      </div>
    </button>
  )
}

/** 布局缩略图 */
export function LayoutPreview({ layout }: { layout: LayoutStyle }) {
  if (layout === 'horizontal') {
    return (
      <div className="flex h-13.5 w-full flex-col gap-0.75">
        <div className="rounded-[2px] flex h-3 items-center gap-1 bg-primary px-1">
          <span className="h-1 w-3 rounded-full bg-white/80" />
          <span className="h-1 w-2 rounded-full bg-white/50" />
          <span className="h-1 w-2 rounded-full bg-white/50" />
        </div>
        <div className="rounded-[2px] flex-1 bg-primary/12 border border-dashed border-primary/25" />
      </div>
    )
  }

  if (layout === 'classic') {
    return (
      <div className="flex h-13.5 w-full flex-col gap-0.75">
        <div className="rounded-[2px] h-2.5 bg-primary/25" />
        <div className="flex flex-1 gap-0.75">
          <div className="rounded-[2px] w-4 bg-primary/25" />
          <div className="rounded-[2px] flex-1 bg-primary/12 border border-dashed border-primary/25" />
        </div>
      </div>
    )
  }

  if (layout === 'double') {
    return (
      <div className="flex h-13.5 w-full gap-0.75">
        <div className="rounded-[2px] w-2.5 bg-primary" />
        <div className="rounded-[2px] w-4 bg-primary/25" />
        <div className="flex flex-1 flex-col gap-0.75">
          <div className="rounded-[2px] h-2.5 bg-primary/12" />
          <div className="rounded-[2px] flex-1 bg-primary/12 border border-dashed border-primary/25" />
        </div>
      </div>
    )
  }

  if (layout === 'mixed') {
    return (
      <div className="flex h-13.5 w-full flex-col gap-0.75">
        <div className="rounded-[2px] h-2.5 bg-primary" />
        <div className="flex flex-1 gap-0.75">
          <div className="rounded-[2px] w-5 bg-primary" />
          <div className="rounded-[2px] flex-1 bg-primary/12 border border-dashed border-primary/25" />
        </div>
      </div>
    )
  }

  if (layout === 'split') {
    return (
      <div className="flex h-13.5 w-full gap-0.75 p-0.5">
        <div className="rounded-[2px] w-2.5 bg-primary" />
        <div className="rounded-[2px] w-4 bg-primary/25" />
        <div className="flex flex-1 flex-col gap-0.75">
          <div className="rounded-[2px] flex h-3 items-center gap-1 bg-primary/12 px-1">
            <span className="h-1 w-2 rounded-full bg-white/80" />
            <span className="h-1 w-2 rounded-full bg-white/50" />
            <span className="h-1 w-2 rounded-full bg-white/50" />
          </div>
          <div className="rounded-[2px] flex-1 bg-primary/12 border border-dashed border-primary/25" />
        </div>
      </div>
    )
  }

  // vertical
  return (
    <div className="flex h-13.5 w-full gap-0.75">
      <div className="flex w-5 flex-col gap-0.75">
        <div className="rounded-[2px] h-2.5 bg-primary" />
        <div className="rounded-[2px] flex-1 bg-primary/25" />
      </div>
      <div className="flex flex-1 flex-col gap-0.75">
        <div className="rounded-[2px] h-2.5 bg-primary/35" />
        <div className="rounded-[2px] flex-1 bg-primary/12 border border-dashed border-primary/25" />
      </div>
    </div>
  )
}

/** 登录页缩略图 */
export function LoginPreview({ variant }: { variant: LoginStyle }) {
  switch (variant) {
    case 'split':
      return (
        <div className="flex h-11.5 w-full rounded-[3px] overflow-hidden">
          <div className="flex w-1/2 flex-col items-center justify-center gap-1 bg-primary">
            <span className="size-2 rounded-[2px] bg-white/85" />
            <span className="h-0.5 w-6 rounded-full bg-white/50" />
          </div>
          <div className="flex w-1/2 flex-col justify-center gap-0.75 bg-[color-mix(in_oklab,var(--primary)_6%,var(--background))] px-2">
            <span className="rounded-[2px] h-0.75 w-7 bg-primary/45" />
            <span className="rounded-[2px] h-0.75 w-full bg-primary/20" />
            <span className="rounded-[2px] h-0.75 w-full bg-primary/20" />
            <span className="rounded-[2px] h-1 w-6 bg-primary/70" />
          </div>
        </div>
      )
    case 'glass':
      return (
        <div className="flex h-11.5 w-full rounded-[3px] relative items-center justify-center overflow-hidden bg-linear-to-br from-primary/85 via-primary/60 to-primary/30">
          <span className="absolute -top-2 -left-1 size-6 rounded-full bg-white/25 blur-[3px]" />
          <span className="absolute right-1 bottom-0 size-5 rounded-full bg-white/30 blur-[2px]" />
          <div className="relative flex w-14 flex-col items-center gap-0.75 rounded-[3px] border border-white/50 bg-white/30 p-1.5 backdrop-blur-[1px]">
            <span className="h-0.75 w-8 rounded-full bg-white/80" />
            <span className="h-0.75 w-full rounded-full bg-white/50" />
            <span className="h-1 w-8 rounded-full bg-white/85" />
          </div>
        </div>
      )
    case 'slider':
      return (
        <div className="flex h-11.5 w-full rounded-[3px] relative items-stretch gap-1 bg-muted/60 p-1">
          <div className="flex w-1/2 flex-col justify-center gap-0.75 rounded-[2px] bg-card px-1.5 shadow-sm">
            <span className="rounded-[2px] h-0.75 w-6 bg-primary/50" />
            <span className="rounded-[2px] h-0.75 w-full bg-primary/15" />
            <span className="rounded-[2px] h-1 w-5 bg-primary/70" />
          </div>
          <div className="flex w-1/2 flex-col justify-center gap-0.75 rounded-[2px] bg-card/50 px-1.5">
            <span className="rounded-[2px] h-0.75 w-6 bg-primary/30" />
            <span className="rounded-[2px] h-0.75 w-full bg-primary/10" />
          </div>
          <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card" />
        </div>
      )
    case 'bubble':
      return (
        <div className="flex h-11.5 w-full rounded-[3px] relative items-center justify-center overflow-hidden bg-[color-mix(in_oklab,var(--primary)_8%,var(--background))]">
          <span className="absolute top-1 left-2 size-3 rounded-full bg-primary/25" />
          <span className="absolute right-3 bottom-1.5 size-4 rounded-full bg-primary/15" />
          <span className="absolute top-3 right-6 size-2 rounded-full bg-primary/30" />
          <div className="relative flex w-14 flex-col gap-0.75 rounded-lg bg-card/90 p-1.5 shadow-sm">
            <span className="h-0.75 w-7 rounded-full bg-primary/45" />
            <span className="h-0.75 w-full rounded-full bg-primary/15" />
            <span className="h-1 w-7 rounded-full bg-primary/70" />
          </div>
        </div>
      )
    case 'immersive':
      return (
        <div className="flex h-11.5 w-full rounded-[3px] relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,var(--primary),color-mix(in_oklab,var(--primary)_45%,#0b1220))]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff2_1px,transparent_1px),linear-gradient(to_bottom,#fff2_1px,transparent_1px)] opacity-25" />
          <div className="relative flex w-16 flex-col gap-0.75 rounded-[3px] border border-white/40 bg-white/20 p-1.5">
            <span className="h-0.75 w-8 rounded-full bg-white/85" />
            <span className="h-0.75 w-full rounded-full bg-white/45" />
            <span className="h-1 w-8 rounded-full bg-white" />
          </div>
        </div>
      )
    default:
      return (
        <div className="flex h-11.5 w-full rounded-[3px] relative items-center justify-center overflow-hidden bg-[color-mix(in_oklab,var(--primary)_5%,var(--background))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_35%,transparent)_1px,transparent_1px)] opacity-60" />
          <div className="relative flex w-14 flex-col gap-0.75 rounded-[3px] border border-primary/25 bg-card p-1.5 shadow-sm">
            <span className="h-0.75 w-7 rounded-full bg-primary/60" />
            <span className="h-0.75 w-full rounded-full bg-primary/15" />
            <span className="h-1 w-7 rounded-full bg-primary/75" />
          </div>
        </div>
      )
  }
}
