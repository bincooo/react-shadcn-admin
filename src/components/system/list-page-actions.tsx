import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/components/system/use-permission'

/**
 * 系统管理各列表页的页头操作区：刷新 + 受权限控制的新增。
 *
 * 四个系统页（用户 / 角色 / 菜单 / 部门）的这段按钮完全是同一份实现，
 * 差异只有「新增按钮需要哪个权限码」和「点击后做什么」，因此收在这里；
 * 页面只负责把 `onRefresh` / `onCreate` 接到自己的 sync 钩子上。
 */
export function ListPageActions({
  createPermission,
  onRefresh,
  onCreate,
}: {
  /** 新增按钮所需的权限码；无权限时按钮不渲染 */
  createPermission: string
  onRefresh: () => void
  onCreate: () => void
}) {
  const { t } = useTranslation()
  const can = usePermission()

  return (
    <>
      <Button variant="outline" onClick={onRefresh}>
        <RefreshCw data-icon="inline-start" />
        {t('common.refresh')}
      </Button>
      {can(createPermission) && (
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" />
          {t('common.create')}
        </Button>
      )}
    </>
  )
}
