import type { ReactNode } from 'react'
import { Button } from '@repo/ui/components/button'
import { usePermission } from '@/hooks/use-permission'

export function PermissionButton({
  className,
  permission,
  children,
  onClick,
  variant,
  disabled = false,
  title,
}: {
  className?: string
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'destructive'
    | 'link'
    | null
    | undefined
  /** 按钮所需的权限码；无权限时按钮禁用 */
  permission: string
  /** 除权限外的额外禁用条件，如未勾选任何行 */
  disabled?: boolean
  /** 按钮内容 */
  children: ReactNode
  /** 原生 title 提示，可用于说明禁用原因 */
  title?: string
  onClick: () => void
}) {
  const can = usePermission()
  return (
    <Button
      variant={variant}
      className={className}
      disabled={!can(permission) || disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
