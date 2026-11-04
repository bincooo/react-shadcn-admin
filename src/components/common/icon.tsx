import { DynamicIcon } from 'lucide-react/dynamic'
import { resolveIconName } from '@/lib/icons/icon-name'
import { cn } from '@/lib/utils'

interface IconProps {
  /** 图标名：lucide 的 `kebab-case` 或 `PascalCase` 都可以 */
  name: string
  className?: string
  strokeWidth?: number
}

/**
 * 按名字渲染图标。
 *
 * 走 `lucide-react` 的 `DynamicIcon`：按名字动态 `import()` 对应图标模块，只有真正用到的
 * 图标才会被加载，因此不需要维护「名字 → 组件」的映射表。名字写法不敏感，PascalCase 与
 * kebab-case 都接受；无法识别的名字回退成 `list`。
 */
export function Icon({ name, className, strokeWidth }: IconProps) {
  return (
    <DynamicIcon
      name={resolveIconName(name)}
      className={className}
      strokeWidth={strokeWidth}
      // 与图标同尺寸的占位：`DynamicIcon` 在模块到位前返回 null，图标位会塌陷再撑开，
      // 导致相邻文字横向跳动
      fallback={() => <span className={cn('block size-4', className)} />}
    />
  )
}
