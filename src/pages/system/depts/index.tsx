import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/header'
import { ConfirmDeleteDialog } from '@/components/system/confirm-delete-dialog'
import { ListPageActions } from '@/components/system/list-page-actions'
import type { SystemDeptTreeNode } from '@/api/system/dept'
import { DeptDialog } from './modules/dept-dialogs'
import type { DeptDeleteTarget } from './modules/dept-dialogs'
import { DeptsTable } from './modules/depts-table'
import { useDeptsSync } from './modules/use-depts-sync'

/**
 * 系统管理 → 部门管理：部门树形表格与新建/编辑/删除。
 *
 * 数据来自真实后端 `/api/departments/tree`（仅管理员可用）；树层级与
 * 缩进由表格的 children 数据驱动，变更逻辑收在 `modules/use-depts-sync`，
 * 本组件只做布局组合与删除确认目标。
 */
export default function SystemDeptsPage() {
  const { t } = useTranslation()
  const deptsSync = useDeptsSync()
  const [deleteTargetState, setDeleteTarget] =
    useState<DeptDeleteTarget | null>(null)
  const { editing, open } = deptsSync.dialogState

  const requestDelete = (dept: SystemDeptTreeNode) =>
    setDeleteTarget({ id: dept.id, deptName: dept.deptName })

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeader
        title={t('menu.dept')}
        description={t('system.dept.description')}
        actions={
          <ListPageActions
            createPermission="system:dept:create"
            onRefresh={deptsSync.refresh}
            onCreate={deptsSync.openCreate}
          />
        }
      />
      <DeptsTable deptsSync={deptsSync} onDeleteRequest={requestDelete} />
      {/* key 重挂载整个抽屉：打开/切换目标时以最新编辑对象重建表单初值 */}
      <DeptDialog
        key={`${editing?.id ?? 'create'}-${open}`}
        deptsSync={deptsSync}
      />
      <ConfirmDeleteDialog
        open={deleteTargetState !== null}
        description={
          deleteTargetState
            ? t('system.dept.deleteOne', { name: deleteTargetState.deptName })
            : ''
        }
        pendingState={deptsSync.deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTargetState) return
          deptsSync.deleteMutation.mutate(deleteTargetState.id, {
            onSettled: () => setDeleteTarget(null),
          })
        }}
      />
    </div>
  )
}
