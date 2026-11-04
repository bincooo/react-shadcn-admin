import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** 顶栏图标按钮的统一配色 */
export const ICON_BTN = 'text-muted-foreground [&_svg]:size-5'
/** 顶栏图标按钮：必须有 aria-label（图标本身无文本），尺寸与圆角与 ICON_BTN 保持一致 */
export function IconBtn({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className={cn(ICON_BTN, className)}
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
