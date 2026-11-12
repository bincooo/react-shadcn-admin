import { useState } from 'react'
import { ListTree, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Header } from '@/components/common/header'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui/components/empty'
import { DeleteDialog } from '@/components/common/delete-dialog'
import { usePermission } from '@/hooks/use-permission'
import { SearchPanel, SearchTextField } from '@/components/common/search-panel'
import { MenuDialog } from './modules/dialog'
import { MenuDetail } from './modules/detail'
import { MenuPermissionsTable } from './modules/permissions'
import { MenusTree } from './modules/tree'
import { useMenu } from './modules/use-menu'
import { countBranchNodes, findMenuNode, menuNameLabel } from './modules/model'

/** 右侧未选中任何节点时的占位 */
function DetailPlaceholder() {
  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTree />
          </EmptyMedia>
          <EmptyTitle>{'未选择菜单'}</EmptyTitle>
          <EmptyDescription>
            {'在左侧菜单树中选择一个节点，查看详情与按钮权限。'}
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
 * 前端契约——名称可为中文文案或词条 key（统一按中文展示），图标存 Lucide 图标名。
 * 关键字筛选作用于左侧树；选中节点从原始树派生，
 * 变更逻辑收在 `modules/use-menu`，本组件只做布局组合。
 */
export default function MenusPage() {
  const can = usePermission()
  const menuMgr = useMenu()
  const [selectedIdState, setSelectedId] = useState<string | null>(null)
  // 从原始树派生选中节点：树被过滤或节点被删除后详情自动回落到占位
  const selectedMenu = selectedIdState
    ? findMenuNode(menuMgr.allMenus, selectedIdState)
    : null
  // 抽屉每次打开 / 切换目标都重挂载，以最新编辑对象重建表单初值
  const { editing, parentId, open } = menuMgr.dialog
  const dialogKey = `${editing?.id ?? `create-${parentId}`}-${open}`

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <Header
        className="pr-4"
        title={'菜单管理'}
        description={'侧边导航的菜单树维护，改动即时生效。'}
        actions={
          <>
            <Button variant="outline" onClick={menuMgr.refresh}>
              <RefreshCw data-icon="inline-start" />
              {'刷新'}
            </Button>
            {can('system:menu:create') && (
              <Button onClick={() => menuMgr.openCreate()}>
                <Plus data-icon="inline-start" />
                {'新增'}
              </Button>
            )}
          </>
        }
      />
      <SearchPanel
        onReset={menuMgr.resetFilters}
        onSearch={menuMgr.submitSearch}
      >
        <SearchTextField
          id="system-menu-keyword"
          label="名称"
          placeholder="请输入"
          value={menuMgr.keyword}
          onChange={menuMgr.setKeyword}
          onSearch={menuMgr.submitSearch}
        />
      </SearchPanel>
      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        <Card className="flex max-h-96 w-full shrink-0 flex-col overflow-hidden py-0 xl:max-h-none xl:h-full xl:w-88">
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            {/* 细头交代这栏是什么、有多少可选节点，与右侧卡片头部呼应 */}
            <div className="flex shrink-0 items-baseline justify-between border-b px-3 py-2.5">
              <span className="text-[13px] font-medium">菜单树</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {`${countBranchNodes(menuMgr.menus)} 个节点`}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto py-2">
              <MenusTree
                menus={menuMgr.menus}
                selectedId={selectedIdState}
                draggable={
                  can('system:menu:update') &&
                  !menuMgr.filtering &&
                  !menuMgr.isReordering
                }
                onReorder={menuMgr.reorderMenu}
                onSelect={(menu) => setSelectedId(menu.id)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          {selectedMenu ? (
            <>
              <MenuDetail menu={selectedMenu} menuMgr={menuMgr} />
              {/* key 随节点切换重挂载：重置权限表的多选集合 */}
              <MenuPermissionsTable
                key={selectedMenu.id}
                menu={selectedMenu}
                menuMgr={menuMgr}
              />
            </>
          ) : (
            <DetailPlaceholder />
          )}
        </div>
      </div>
      <MenuDialog key={dialogKey} menuMgr={menuMgr} />
      <DeleteDialog
        open={menuMgr.deleting !== null}
        description={`确认删除菜单「${
          menuMgr.deleting ? menuNameLabel(menuMgr.deleting.menuName) : ''
        }」（${menuMgr.deleting?.menuCode}）？删除后不可恢复。`}
        pending={menuMgr.deleteMutation.isPending}
        onClose={menuMgr.closeDelete}
        confirmLabel={
          menuMgr.deleting?.menuType === 'BUTTON' ? '删除' : '级联删除'
        }
        disableCancelWhilePending
        onConfirm={() => {
          if (!menuMgr.deleting) return
          menuMgr.deleteMutation.mutate({
            menuId: menuMgr.deleting.id,
            cascade: true,
          })
        }}
      >
        {(menuMgr.deleting?.children?.length ?? 0) > 0 && (
          <p className="text-[12.5px] text-muted-foreground">
            {`该菜单下有 ${menuMgr.deleting?.children?.length ?? 0} 个直接子级，将连同全部后代一并删除。`}
          </p>
        )}
      </DeleteDialog>
      <DeleteDialog
        open={
          menuMgr.batchDeleting !== null && menuMgr.batchDeleting.length > 0
        }
        description={`确认删除选中的 ${menuMgr.batchDeleting?.length ?? 0} 个按钮权限？删除后不可恢复。`}
        pending={menuMgr.batchDeleteMutation.isPending}
        onClose={menuMgr.closeBatchDelete}
        disableCancelWhilePending
        onConfirm={() => {
          if (menuMgr.batchDeleting) {
            menuMgr.batchDeleteMutation.mutate(menuMgr.batchDeleting)
          }
        }}
      />
    </div>
  )
}
