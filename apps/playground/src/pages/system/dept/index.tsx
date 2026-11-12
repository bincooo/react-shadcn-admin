import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Header } from '@/components/common/header'
import { DeleteDialog } from '@/components/common/delete-dialog'
import { usePermission } from '@/hooks/use-permission'
import type { DeptTreeNode } from '@/api/system/dept'
import { DeptDialog } from './modules/dialog'
import type { DeptDeleteTarget } from './modules/dialog'
import { DeptTable } from './modules/table'
import { useDept } from './modules/use-dept'

/**
 * 系统管理 → 部门管理：部门树形表格与新建/编辑/删除。
 *
 * 数据来自真实后端 `/api/departments/tree`（仅管理员可用）；树层级与
 * 缩进由表格的 children 数据驱动，变更逻辑收在 `modules/use-dept`，
 * 本组件只做布局组合与删除确认目标。
 */
export default function DeptsPage() {
  const can = usePermission()
  const deptMgr = useDept()
  const [deleteTargetState, setDeleteTarget] =
    useState<DeptDeleteTarget | null>(null)
  const { editing, open } = deptMgr.dialog

  const requestDelete = (dept: DeptTreeNode) =>
    setDeleteTarget({ id: dept.id, deptName: dept.deptName })

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <Header
        className="pr-4"
        title={'部门管理'}
        description={'组织部门的树形维护，改动即时生效。'}
        actions={
          <>
            <Button variant="outline" onClick={deptMgr.refresh}>
              <RefreshCw data-icon="inline-start" />
              {'刷新'}
            </Button>
            {can('system:dept:create') && (
              <Button onClick={deptMgr.openCreate}>
                <Plus data-icon="inline-start" />
                {'新增'}
              </Button>
            )}
          </>
        }
      />
      <DeptTable deptMgr={deptMgr} onDeleteRequest={requestDelete} />
      {/* key 重挂载整个抽屉：打开/切换目标时以最新编辑对象重建表单初值 */}
      <DeptDialog
        key={`${editing?.id ?? 'create'}-${open}`}
        deptMgr={deptMgr}
      />
      <DeleteDialog
        open={deleteTargetState !== null}
        description={
          deleteTargetState
            ? `确认删除部门「${deleteTargetState.deptName}」？删除后不可恢复。`
            : ''
        }
        pending={deptMgr.deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTargetState) return
          deptMgr.deleteMutation.mutate(deleteTargetState.id, {
            onSettled: () => setDeleteTarget(null),
          })
        }}
      />
    </div>
  )
}
