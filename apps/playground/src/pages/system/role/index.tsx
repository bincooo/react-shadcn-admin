import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Header } from '@/components/common/header'
import { DeleteDialog } from '@/components/common/delete-dialog'
import { usePermission } from '@/hooks/use-permission'
import {
  SearchPanel,
  SearchStatusField,
  SearchTextField,
} from '@/components/common/search-panel'
import { AssignUsersDialog } from './modules/assign-users'
import { RoleDialog } from './modules/dialog'
import { AssignPermissionsDialog } from './modules/assign-permissions'
import { RoleTable } from './modules/table'
import { useRole } from './modules/use-role'

/**
 * 系统管理 → 角色管理：角色分页列表、增删改，以及给角色分配用户。
 *
 * 数据来自真实后端 `/api/roles`（仅管理员可用）；分配用户走
 * `/api/roles/{roleCode}/users` 全量替换关联。变更与弹窗状态收在
 * `modules/use-role`，本组件只做布局组合。
 */
export default function RolesPage() {
  const can = usePermission()
  const roleMgr = useRole()
  const { editing, open } = roleMgr.dialog

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <Header
        className="pr-4"
        title={'角色管理'}
        description={'系统角色的增删改查，并支持给角色分配用户。'}
        actions={
          <>
            <Button variant="outline" onClick={roleMgr.refresh}>
              <RefreshCw data-icon="inline-start" />
              {'刷新'}
            </Button>
            {can('system:role:create') && (
              <Button onClick={roleMgr.openCreate}>
                <Plus data-icon="inline-start" />
                {'新增'}
              </Button>
            )}
          </>
        }
      />
      <SearchPanel
        onReset={roleMgr.resetFilters}
        onSearch={roleMgr.submitSearch}
      >
        <SearchTextField
          id="system-role-keyword"
          label={'角色编码/名称'}
          placeholder={'请输入'}
          value={roleMgr.keyword}
          onChange={roleMgr.setKeyword}
          onSearch={roleMgr.submitSearch}
        />
        <SearchStatusField
          id="system-role-status"
          value={roleMgr.status}
          onChange={roleMgr.setStatus}
        />
      </SearchPanel>
      <RoleTable
        roleMgr={roleMgr}
        onAssign={roleMgr.openAssign}
        onMenus={roleMgr.openMenus}
        onDeleteRequest={roleMgr.openDelete}
      />
      {/* key 重挂载整个抽屉：打开/切换目标时以最新编辑对象重建表单初值 */}
      <RoleDialog
        key={`${editing?.id ?? 'create'}-${open}`}
        roleMgr={roleMgr}
      />
      <AssignUsersDialog role={roleMgr.assign} roleMgr={roleMgr} />
      <AssignPermissionsDialog
        role={roleMgr.menus}
        onClose={roleMgr.closeMenus}
      />
      <DeleteDialog
        open={roleMgr.deleteTarget !== null}
        description={roleMgr.deleteTarget?.description ?? ''}
        pending={roleMgr.deleteManyMutation.isPending}
        onClose={roleMgr.closeDelete}
        onConfirm={() => {
          const target = roleMgr.deleteTarget
          if (!target) return
          roleMgr.deleteManyMutation.mutate(target.roleIds)
        }}
      />
    </div>
  )
}
