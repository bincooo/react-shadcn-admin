import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createDept,
  deleteDept,
  fetchDeptTree,
  updateDept,
} from '@/api/system/dept'
import type {
  DeptCreateInput,
  DeptTreeNode,
  DeptUpdateInput,
} from '@/api/system/dept'
import { errorMessage } from '@/lib/format'

interface DeptDialogProps {
  open: boolean
  /** 非空表示编辑该部门，空表示新建 */
  editing: DeptTreeNode | null
}

/**
 * 部门管理页的全部状态：部门树数据与新建/编辑/删除变更。
 *
 * 树为全量数据（后端按 sort 排好序，无分页与筛选），变更成功后失效
 * 缓存重新拉取；对话框状态收在这里，表格与弹窗只消费。
 */
export function useDept() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<DeptDialogProps>({
    open: false,
    editing: null,
  })

  const query = useQuery({
    queryKey: ['dept'],
    queryFn: fetchDeptTree,
  })

  const invalidateTree = () =>
    queryClient.invalidateQueries({ queryKey: ['dept'] })

  const createMutation = useMutation({
    mutationFn: (input: DeptCreateInput) => createDept(input),
    onSuccess: () => {
      toast.success('部门创建成功')
      setDialog({ open: false, editing: null })
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DeptUpdateInput }) =>
      updateDept(id, input),
    onSuccess: () => {
      toast.success('部门已更新')
      setDialog({ open: false, editing: null })
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDept(id),
    onSuccess: () => {
      toast.success('部门已删除')
      setDialog({ open: false, editing: null })
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return {
    // 数据
    deptTree: query.data ?? [],
    isFetching: query.isFetching,
    refresh: invalidateTree,
    // 新建 / 编辑
    dialog,
    openCreate: () => setDialog({ open: true, editing: null }),
    openEdit: (dept: DeptTreeNode) => setDialog({ open: true, editing: dept }),
    closeEdit: () => setDialog({ open: false, editing: null }),
    // 变更
    createMutation,
    updateMutation,
    deleteMutation,
  }
}

export type DeptState = ReturnType<typeof useDept>
