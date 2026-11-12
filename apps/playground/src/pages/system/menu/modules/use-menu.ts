import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useBatchDeleteMutation } from '@/hooks/use-batch-delete-mutation'
import {
  createMenu,
  deleteMenu,
  deleteMenus,
  fetchMenuTree,
  updateMenu,
} from '@/api/system/menu'
import type { Menu, MenuInput } from '@/api/system/menu'
import { errorMessage } from '@/lib/format'
import {
  collectSelfAndDescendantIds,
  filterMenuTree,
  reorderMenuTree,
} from './model'

interface MenuDialogProps {
  open: boolean
  /** 非空表示编辑该菜单，空表示新建 */
  editing: Menu | null
  /** 新建时的预置父级 id（「添加子级」入口）；空串表示根 */
  parentId: string
  /** 按钮创建模式：类型固定为 BUTTON，供按钮权限列表的「添加」入口 */
  buttonMode: boolean
}

const CLOSED_DIALOG: MenuDialogProps = {
  open: false,
  editing: null,
  parentId: '',
  buttonMode: false,
}

/**
 * 菜单管理页的全部状态：管理树数据、筛选与新建/编辑/删除变更。
 *
 * 树为全量数据（无分页、无服务端筛选），筛选在客户端完成，
 * 变更成功后失效缓存重新拉取；对话框状态收在这里，表格与弹窗只消费。
 */
export function useMenu() {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<MenuDialogProps>(CLOSED_DIALOG)
  const [deletingState, setDeleting] = useState<Menu | null>(null)
  // 批量删除目标：按钮权限列表多选后待确认的编码集合
  const [batchDeletingState, setBatchDeleting] = useState<string[] | null>(null)
  // 筛选：草稿值随输入变化，提交（搜索/回车）后才作用于树，与用户管理页交互一致
  const [draftKeywordState, setDraftKeyword] = useState('')
  const [appliedKeywordState, setAppliedKeyword] = useState('')

  const query = useQuery({
    queryKey: ['menu'],
    queryFn: fetchMenuTree,
  })

  // 保持数组引用稳定，避免过滤结果与父级候选随每次渲染重算
  const menus = useMemo(() => query.data ?? [], [query.data])
  const filtering = appliedKeywordState.trim() !== ''
  const filteredMenus = useMemo(
    () => (filtering ? filterMenuTree(menus, appliedKeywordState) : menus),
    [menus, filtering, appliedKeywordState],
  )

  // 编辑目标子树排除（父级下拉用）：仅在编辑目标变化时重算
  const excludedIds = useMemo(
    () =>
      dialog.editing
        ? collectSelfAndDescendantIds(dialog.editing, new Set())
        : new Set<string>(),
    [dialog.editing],
  )

  const invalidateTree = () => {
    queryClient.invalidateQueries({ queryKey: ['menu'] })
    queryClient.invalidateQueries({ queryKey: ['nav-menu'] })
  }

  const closeBatchDelete = () => setBatchDeleting(null)

  const reorderMutation = useMutation({
    mutationFn: async ({ updates }: { nextTree: Menu[]; updates: Menu[] }) => {
      for (const node of updates) {
        await updateMenu(node.id, {
          menuCode: node.menuCode,
          parentMenuId: node.parentMenuId,
          menuName: node.menuName,
          menuType: node.menuType,
          menuUrl: node.menuUrl ?? undefined,
          imageIcon: node.imageIcon ?? undefined,
          seq: node.seq,
          status: node.status,
        })
      }
    },
    onMutate: async ({ nextTree }: { nextTree: Menu[]; updates: Menu[] }) => {
      await queryClient.cancelQueries({ queryKey: ['menu'] })
      const previous = queryClient.getQueryData<Menu[]>(['menu'])
      queryClient.setQueryData(['menu'], nextTree)
      return { previous }
    },
    onSuccess: () => {
      toast.success('菜单排序已更新')
      invalidateTree()
    },
    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['menu'], context.previous)
      }
      toast.error(errorMessage(error))
    },
  })

  const reorderMenu = (
    dragId: string,
    targetId: string,
    position: -1 | 0 | 1,
  ) => {
    if (filtering || reorderMutation.isPending) return
    const result = reorderMenuTree(menus, dragId, targetId, position)
    if (!result) return
    reorderMutation.mutate(result)
  }

  const saveMutation = useMutation({
    mutationFn: ({
      menuId,
      input,
    }: {
      /** 非空表示编辑该 id 的菜单 */
      menuId: string | null
      input: MenuInput
    }) => (menuId === null ? createMenu(input) : updateMenu(menuId, input)),
    onSuccess: (_, { menuId }) => {
      toast.success(menuId === null ? '菜单创建成功' : '菜单已更新')
      setDialog(CLOSED_DIALOG)
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ menuId, cascade }: { menuId: string; cascade: boolean }) =>
      deleteMenu(menuId, cascade),
    onSuccess: () => {
      toast.success('菜单已删除')
      setDeleting(null)
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  // 批量删除按钮权限：按钮都是叶子节点，一次请求按非级联删除，完成后统一提示刷新
  const batchDeleteMutation = useBatchDeleteMutation<string>({
    removeMany: (menuIds) => deleteMenus(menuIds, false),
    entityLabel: '按钮权限',
    onDeleted: () => {
      closeBatchDelete()
      invalidateTree()
    },
  })

  return {
    // 数据
    menus: filteredMenus,
    // 未过滤原始树：选中节点详情从这里派生，避免搜索过滤后详情消失
    allMenus: menus,
    isFetching: query.isFetching,
    refresh: invalidateTree,
    // 筛选：草稿值 + 提交值（交互口径与用户管理页一致）
    keyword: draftKeywordState,
    setKeyword: setDraftKeyword,
    submitSearch: () => setAppliedKeyword(draftKeywordState),
    resetFilters: () => {
      setDraftKeyword('')
      setAppliedKeyword('')
    },
    // 编辑目标子树排除（父级下拉用）；无编辑目标时返回空集合
    excludedIds,
    // 对话框与变更
    filtering,
    reorderMenu,
    isReordering: reorderMutation.isPending,
    dialog,
    openCreate: (parentId = '') =>
      setDialog({ open: true, editing: null, parentId, buttonMode: false }),
    openCreateButton: (parentId: string) =>
      setDialog({ open: true, editing: null, parentId, buttonMode: true }),
    openEdit: (menu: Menu) =>
      setDialog({
        open: true,
        editing: menu,
        parentId: '',
        buttonMode: false,
      }),
    closeEdit: () => setDialog(CLOSED_DIALOG),
    saveMutation,
    deleting: deletingState,
    openDelete: setDeleting,
    closeDelete: () => setDeleting(null),
    deleteMutation,
    // 批量删除（按钮权限列表）
    batchDeleting: batchDeletingState,
    openBatchDelete: setBatchDeleting,
    closeBatchDelete,
    batchDeleteMutation,
  }
}

export type MenuState = ReturnType<typeof useMenu>
