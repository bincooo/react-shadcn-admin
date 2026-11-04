import type { FormEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const WIDTH_CLASS = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
} as const

/**
 * 新建/编辑表单抽屉外壳：标题、描述、可滚动的字段区与固定在底部的
 * 取消/确认按钮。字段区负外边距 + 等量内边距为焦点环留出 4px，
 * 避免被滚动容器裁掉。
 */
export function FormSheet({
  open,
  onClose,
  title,
  description,
  pendingState,
  onSubmit,
  width = 'md',
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description: ReactNode
  pendingState: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  width?: keyof typeof WIDTH_CLASS
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <SheetContent
        side="right"
        className={cn('flex min-h-0 flex-col gap-0 p-4', WIDTH_CLASS[width])}
      >
        <SheetHeader className="pb-2">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-2">
            {children}
          </div>
          <SheetFooter className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={pendingState}>
              {t('common.confirm')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

/** 表单字段：标签在上、控件在下，可选补充说明 */
export function FormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** 启用状态字段：标签在左、开关与状态文案在右 */
export function FormSwitchField({
  label,
  htmlFor,
  checked,
  onCheckedChange,
}: {
  label: string
  htmlFor: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="flex items-center gap-2">
        <Switch
          id={htmlFor}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <span
          className={
            checked
              ? 'text-[13px] text-success'
              : 'text-[13px] text-muted-foreground'
          }
        >
          {checked ? t('common.enabled') : t('common.disabled')}
        </span>
      </div>
    </div>
  )
}
