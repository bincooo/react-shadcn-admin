import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createSystemDept,
  deleteSystemDept,
  fetchSystemDeptTree,
  updateSystemDept,
} from '@/api/system/dept'
import type {
  SystemDeptCreateInput,
  SystemDeptTreeNode,
  SystemDeptUpdateInput,
} from '@/api/system/dept'
import { errorMessage } from '@/lib/format'

interface DeptDialogState {
  open: boolean
  /** 非空表示编辑该部门，空表示新建 */
  editing: SystemDeptTreeNode | null
}

/**
 * 部门管理页的全部状态：部门树数据与新建/编辑/删除变更。
 *
 * 树为全量数据（后端按 sort 排好序，无分页与筛选），变更成功后失效
 * 缓存重新拉取；对话框状态收在这里，表格与弹窗只消费。
 */
export function useDeptsSync() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [dialogState, setDialog] = useState<DeptDialogState>({
    open: false,
    editing: null,
  })

  const query = useQuery({
    queryKey: ['system-depts'],
    queryFn: fetchSystemDeptTree,
  })

  const invalidateTree = () =>
    queryClient.invalidateQueries({ queryKey: ['system-depts'] })

  const closeDialog = () => setDialog({ open: false, editing: null })

  const createMutation = useMutation({
    mutationFn: (input: SystemDeptCreateInput) => createSystemDept(input),
    onSuccess: () => {
      toast.success(
        t('system.action.create', { entity: t('system.entity.dept') }),
      )
      closeDialog()
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SystemDeptUpdateInput }) =>
      updateSystemDept(id, input),
    onSuccess: () => {
      toast.success(
        t('system.action.update', { entity: t('system.entity.dept') }),
      )
      closeDialog()
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSystemDept(id),
    onSuccess: () => {
      toast.success(
        t('system.action.delete', { entity: t('system.entity.dept') }),
      )
      closeDialog()
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return {
    // 数据
    deptsTreeState: query.data ?? [],
    isFetchingState: query.isFetching,
    refresh: invalidateTree,
    // 新建 / 编辑
    dialogState,
    openCreate: () => setDialog({ open: true, editing: null }),
    openEdit: (dept: SystemDeptTreeNode) =>
      setDialog({ open: true, editing: dept }),
    closeDialog,
    // 变更
    createMutation,
    updateMutation,
    deleteMutation,
  }
}

export type DeptsSyncState = ReturnType<typeof useDeptsSync>
