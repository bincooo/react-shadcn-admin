import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/header'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/core/form/field'
import { ConfirmDeleteDialog } from '@/components/system/confirm-delete-dialog'
import { ListPageActions } from '@/components/system/list-page-actions'
import { FilterBar } from '@/components/system/filter-bar'
import { AssignUsersDialog } from './modules/assign-users-dialog'
import { RoleDialog } from './modules/role-dialogs'
import { RoleMenusDialog } from './modules/role-menus-dialog'
import { RolesTable } from './modules/roles-table'
import { useRolesSync } from './modules/use-roles-sync'

/**
 * 系统管理 → 角色管理：角色分页列表、增删改，以及给角色分配用户。
 *
 * 数据来自真实后端 `/api/roles`（仅管理员可用）；分配用户走
 * `/api/roles/{roleCode}/users` 全量替换关联。变更与弹窗状态收在
 * `modules/use-roles-sync`，本组件只做布局组合。
 */
export default function SystemRolesPage() {
  const { t } = useTranslation()
  const rolesSync = useRolesSync()
  const { editing, open } = rolesSync.dialogState

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeader
        title={t('menu.role')}
        description={t('system.role.description')}
        actions={
          <ListPageActions
            createPermission="system:role:create"
            onRefresh={rolesSync.refresh}
            onCreate={rolesSync.openCreate}
          />
        }
      />
      <FilterBar
        onReset={rolesSync.resetFilters}
        onSearch={rolesSync.submitSearch}
      >
        <Field label={t('system.role.keyword')} htmlFor="system-role-keyword">
          <Input
            id="system-role-keyword"
            className="w-full"
            placeholder={t('common.pleaseInput')}
            value={rolesSync.keywordState}
            onChange={(e) => rolesSync.setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && rolesSync.submitSearch()}
          />
        </Field>
      </FilterBar>
      <RolesTable
        rolesSync={rolesSync}
        onAssign={rolesSync.openAssign}
        onMenus={rolesSync.openMenus}
        onDeleteRequest={rolesSync.openDelete}
        onBatchDelete={rolesSync.openBatchDelete}
      />
      {/* key 重挂载整个抽屉：打开/切换目标时以最新编辑对象重建表单初值 */}
      <RoleDialog
        key={`${editing?.roleCode ?? 'create'}-${open}`}
        rolesSync={rolesSync}
      />
      <AssignUsersDialog role={rolesSync.assignState} rolesSync={rolesSync} />
      <RoleMenusDialog
        role={rolesSync.menusState}
        onClose={rolesSync.closeMenus}
      />
      <ConfirmDeleteDialog
        open={rolesSync.deleteTargetState !== null}
        description={rolesSync.deleteTargetState?.description ?? ''}
        pendingState={rolesSync.deleteManyMutation.isPending}
        onClose={rolesSync.closeDelete}
        onConfirm={() => {
          const target = rolesSync.deleteTargetState
          if (!target) return
          rolesSync.deleteManyMutation.mutate(target.roleCodes)
        }}
      />
    </div>
  )
}
