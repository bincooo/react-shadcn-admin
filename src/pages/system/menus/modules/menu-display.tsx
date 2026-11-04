import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/common/icon'
import type { SystemMenu } from '@/api/system/menu'
import { MENU_TYPE_LABEL_KEYS } from './menu-tree'

/**
 * 图标名预览：与侧边栏走同一个 `Icon`，所见即所得。
 * 空名不渲染；无法识别的名字在两边都回退成同一个图标。
 */
export function MenuIconPreview({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const trimmed = name.trim()
  if (!trimmed) return null
  return <Icon name={trimmed} className={className} />
}

/** 菜单类型 → 徽标外观：目录为次要、页面为主题色、按钮为描边 */
const TYPE_VARIANTS: Record<
  SystemMenu['menuType'],
  'default' | 'secondary' | 'outline'
> = {
  DIRECTORY: 'secondary',
  MENU: 'default',
  BUTTON: 'outline',
}

export function MenuTypeBadge({ type }: { type: SystemMenu['menuType'] }) {
  const { t } = useTranslation()

  return (
    <Badge variant={TYPE_VARIANTS[type]} className="text-[11px]">
      {t(MENU_TYPE_LABEL_KEYS[type])}
    </Badge>
  )
}

/** 启用状态徽标 */
export function StatusBadge({ status }: { status: SystemMenu['status'] }) {
  const { t } = useTranslation()

  return (
    <Badge
      variant={status === 'ENABLED' ? 'default' : 'secondary'}
      className="text-[11px]"
    >
      {t(status === 'ENABLED' ? 'common.enabled' : 'common.disabled')}
    </Badge>
  )
}
