import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createSystemMenu,
  deleteSystemMenu,
  fetchSystemMenuTree,
  updateSystemMenu,
} from '@/api/system/menu'
import type { SystemMenu, SystemMenuInput } from '@/api/system/menu'
import { errorMessage } from '@/lib/format'
import {
  collectSelfAndDescendants,
  filterMenuTree,
  toTreePredicate,
} from './menu-tree'

interface MenuDialogState {
  open: boolean
  /** 非空表示编辑该菜单，空表示新建 */
  editing: SystemMenu | null
  /** 新建时的预置父级编码（「添加子级」入口） */
  parentCode: string
  /** 按钮创建模式：类型固定为 BUTTON，供按钮权限列表的「添加」入口 */
  buttonMode: boolean
}

const CLOSED_DIALOG: MenuDialogState = {
  open: false,
  editing: null,
  parentCode: '',
  buttonMode: false,
}

/**
 * 菜单管理页的全部状态：管理树数据、筛选与新建/编辑/删除变更。
 *
 * 树为全量数据（无分页、无服务端筛选），筛选在客户端完成，
 * 变更成功后失效缓存重新拉取；对话框状态收在这里，表格与弹窗只消费。
 */
export function useMenusSync() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [dialogState, setDialog] = useState<MenuDialogState>(CLOSED_DIALOG)
  const [deletingState, setDeleting] = useState<SystemMenu | null>(null)
  // 批量删除目标：按钮权限列表多选后待确认的编码集合
  const [batchDeletingState, setBatchDeleting] = useState<string[] | null>(null)
  // 筛选：草稿值随输入变化，提交（搜索/回车）后才作用于树，与用户管理页交互一致
  const [draftKeywordState, setDraftKeyword] = useState('')
  const [appliedKeywordState, setAppliedKeyword] = useState('')

  const query = useQuery({
    queryKey: ['system-menus'],
    queryFn: fetchSystemMenuTree,
  })

  // 保持数组引用稳定，避免过滤结果与父级候选随每次渲染重算
  const menus = useMemo(() => query.data ?? [], [query.data])
  const filtering = appliedKeywordState.trim() !== ''
  const filteredMenus = useMemo(
    () =>
      filtering
        ? filterMenuTree(
            menus,
            toTreePredicate(appliedKeywordState, (name) => t(name)),
          )
        : menus,
    // t 变更（切换语言）时重算过滤结果
    [menus, filtering, appliedKeywordState, t],
  )

  // 编辑目标子树排除（父级下拉用）：仅在编辑目标变化时重算
  const excludedCodes = useMemo(
    () =>
      dialogState.editing
        ? collectSelfAndDescendants(dialogState.editing, new Set())
        : new Set<string>(),
    [dialogState.editing],
  )

  const invalidateTree = () =>
    queryClient.invalidateQueries({ queryKey: ['system-menus'] })

  const closeDialog = () => setDialog(CLOSED_DIALOG)
  const closeBatchDelete = () => setBatchDeleting(null)

  const saveMutation = useMutation({
    mutationFn: ({
      menuCode,
      input,
    }: {
      /** 非空表示编辑该编码的菜单 */
      menuCode: string | null
      input: SystemMenuInput
    }) =>
      menuCode === null
        ? createSystemMenu(input)
        : updateSystemMenu(menuCode, input),
    onSuccess: (_, { menuCode }) => {
      toast.success(
        t(menuCode === null ? 'system.action.create' : 'system.action.update', {
          entity: t('system.entity.menu'),
        }),
      )
      closeDialog()
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: ({
      menuCode,
      cascade,
    }: {
      menuCode: string
      cascade: boolean
    }) => deleteSystemMenu(menuCode, cascade),
    onSuccess: () => {
      toast.success(
        t('system.action.delete', { entity: t('system.entity.menu') }),
      )
      setDeleting(null)
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  // 批量删除按钮权限：按钮都是叶子节点，逐个按非级联删除，完成后统一提示刷新
  const batchDeleteMutation = useMutation({
    mutationFn: async (menuCodes: string[]) => {
      await Promise.all(menuCodes.map((code) => deleteSystemMenu(code, false)))
      return menuCodes.length
    },
    onSuccess: (count) => {
      toast.success(
        t('system.action.deleteMany', {
          count,
          entity: t('system.menu.buttonPermissions'),
        }),
      )
      closeBatchDelete()
      invalidateTree()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return {
    // 数据
    menus: filteredMenus,
    // 未过滤原始树：选中节点详情从这里派生，避免搜索过滤后详情消失
    allMenus: menus,
    isFetchingState: query.isFetching,
    refresh: invalidateTree,
    // 筛选：草稿值 + 提交值（交互口径与用户管理页一致）
    keywordState: draftKeywordState,
    setKeyword: setDraftKeyword,
    submitSearch: () => setAppliedKeyword(draftKeywordState),
    resetFilters: () => {
      setDraftKeyword('')
      setAppliedKeyword('')
    },
    // 编辑目标子树排除（父级下拉用）；无编辑目标时返回空集合
    excludedCodes,
    // 对话框与变更
    dialogState,
    openCreate: (parentCode = '') =>
      setDialog({ open: true, editing: null, parentCode, buttonMode: false }),
    openCreateButton: (parentCode: string) =>
      setDialog({ open: true, editing: null, parentCode, buttonMode: true }),
    openEdit: (menu: SystemMenu) =>
      setDialog({
        open: true,
        editing: menu,
        parentCode: '',
        buttonMode: false,
      }),
    closeDialog,
    saveMutation,
    deletingState,
    openDelete: setDeleting,
    closeDelete: () => setDeleting(null),
    deleteMutation,
    // 批量删除（按钮权限列表）
    batchDeletingState,
    openBatchDelete: setBatchDeleting,
    closeBatchDelete,
    batchDeleteMutation,
  }
}

export type MenusSyncState = ReturnType<typeof useMenusSync>
