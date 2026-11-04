import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListTree } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/common/header'
import { Input } from '@/components/ui/input'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Field } from '@/components/core/form/field'
import { ConfirmDeleteDialog } from '@/components/system/confirm-delete-dialog'
import { ListPageActions } from '@/components/system/list-page-actions'
import { FilterBar } from '@/components/system/filter-bar'
import { MenuDialog } from './modules/menu-dialogs'
import { MenuDetail } from './modules/menu-detail'
import { MenuPermissionsTable } from './modules/menu-permissions-table'
import { MenusTree } from './modules/menus-tree'
import { useMenusSync } from './modules/use-menus-sync'
import { countBranchNodes, findMenuNode } from './modules/menu-tree'

/** 右侧未选中任何节点时的占位 */
function DetailPlaceholder() {
  const { t } = useTranslation()
  return (
    <Card className="flex min-h-64 flex-col">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTree />
          </EmptyMedia>
          <EmptyTitle>{t('system.menu.notSelected')}</EmptyTitle>
          <EmptyDescription>
            {t('system.menu.notSelectedHint')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Card>
  )
}

/**
 * 系统管理 → 菜单管理：左侧菜单树选择，右侧上下分割为详情与按钮权限列表。
 *
 * 数据来自真实后端 `/api/menus/tree`（仅管理员可用）；菜单属性对齐
 * 前端契约——名称兼容 i18n 词条 key，图标存 Lucide 图标名。
 * 关键字筛选作用于左侧树；选中节点从原始树派生，
 * 变更逻辑收在 `modules/use-menus-sync`，本组件只做布局组合。
 */
export default function SystemMenusPage() {
  const { t } = useTranslation()
  const menusSync = useMenusSync()
  const [selectedCodeState, setSelectedCode] = useState<string | null>(null)
  // 从原始树派生选中节点：树被过滤或节点被删除后详情自动回落到占位
  const selectedMenu = selectedCodeState
    ? findMenuNode(menusSync.allMenus, selectedCodeState)
    : null
  // 抽屉每次打开 / 切换目标都重挂载，以最新编辑对象重建表单初值
  const { editing, parentCode, open } = menusSync.dialogState
  const dialogKey = `${editing?.menuCode ?? `create-${parentCode}`}-${open}`

  return (
    <div className="flex min-h-full flex-col gap-4 pb-4">
      <PageHeader
        title={t('menu.menus')}
        description={t('system.menu.description')}
        actions={
          <ListPageActions
            createPermission="system:menu:create"
            onRefresh={menusSync.refresh}
            onCreate={() => menusSync.openCreate()}
          />
        }
      />
      <FilterBar
        onReset={menusSync.resetFilters}
        onSearch={menusSync.submitSearch}
      >
        <Field label={t('system.menu.keyword')} htmlFor="system-menu-keyword">
          <Input
            id="system-menu-keyword"
            className="w-full"
            placeholder={t('common.pleaseInput')}
            value={menusSync.keywordState}
            onChange={(e) => menusSync.setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && menusSync.submitSearch()}
          />
        </Field>
      </FilterBar>
      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="w-full shrink-0 py-0 xl:w-80">
          <CardContent className="p-0">
            {/* 细头交代这栏是什么、有多少可选节点，与右侧卡片头部呼应 */}
            <div className="flex items-baseline justify-between border-b px-3 py-2.5">
              <span className="text-[13px] font-medium">
                {t('system.menu.treeTitle')}
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {t('system.menu.nodeCount', {
                  count: countBranchNodes(menusSync.menus),
                })}
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto p-2 xl:max-h-[calc(100dvh-23rem)]">
              <MenusTree
                menus={menusSync.menus}
                selectedCode={selectedCodeState}
                onSelect={(menu) => setSelectedCode(menu.menuCode)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {selectedMenu ? (
            <>
              <MenuDetail menu={selectedMenu} menusSync={menusSync} />
              {/* key 随节点切换重挂载：重置权限表的多选集合 */}
              <MenuPermissionsTable
                key={selectedMenu.menuCode}
                menu={selectedMenu}
                menusSync={menusSync}
              />
            </>
          ) : (
            <DetailPlaceholder />
          )}
        </div>
      </div>
      <MenuDialog key={dialogKey} menusSync={menusSync} />
      <ConfirmDeleteDialog
        open={menusSync.deletingState !== null}
        description={t('system.menu.deleteOne', {
          name: menusSync.deletingState
            ? t(menusSync.deletingState.menuName)
            : '',
          code: menusSync.deletingState?.menuCode,
        })}
        pendingState={menusSync.deleteMutation.isPending}
        onClose={menusSync.closeDelete}
        confirmLabel={
          menusSync.deletingState?.menuType === 'BUTTON'
            ? t('common.delete')
            : t('system.menu.cascadeDelete')
        }
        disableCancelWhilePending
        onConfirm={() => {
          if (!menusSync.deletingState) return
          menusSync.deleteMutation.mutate({
            menuCode: menusSync.deletingState.menuCode,
            cascade: true,
          })
        }}
      >
        {(menusSync.deletingState?.children?.length ?? 0) > 0 && (
          <p className="text-[12.5px] text-muted-foreground">
            {t('system.menu.deleteCascadeWarning', {
              count: menusSync.deletingState?.children?.length ?? 0,
            })}
          </p>
        )}
      </ConfirmDeleteDialog>
      <ConfirmDeleteDialog
        open={
          menusSync.batchDeletingState !== null &&
          menusSync.batchDeletingState.length > 0
        }
        description={t('system.menu.deleteBatch', {
          count: menusSync.batchDeletingState?.length ?? 0,
        })}
        pendingState={menusSync.batchDeleteMutation.isPending}
        onClose={menusSync.closeBatchDelete}
        disableCancelWhilePending
        onConfirm={() => {
          if (menusSync.batchDeletingState) {
            menusSync.batchDeleteMutation.mutate(menusSync.batchDeletingState)
          }
        }}
      />
    </div>
  )
}
