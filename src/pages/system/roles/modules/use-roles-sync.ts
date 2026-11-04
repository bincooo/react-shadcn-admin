import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { PAGE_SIZE_OPTIONS } from '@/components/system/table-config'
import { useBatchDeleteMutation } from '@/components/system/use-batch-delete'
import { usePagedQueryState } from '@/components/system/use-paged-query'
import {
  createSystemRole,
  deleteSystemRole,
  fetchSystemRoles,
  updateSystemRole,
} from '@/api/system/role'
import type {
  SystemRole,
  SystemRoleCreateInput,
  SystemRoleUpdateInput,
} from '@/api/system/role'
import { errorMessage } from '@/lib/format'

interface RoleFilters {
  keyword: string
}

interface RoleDialogState {
  open: boolean
  /** 非空表示编辑该角色，空表示新建 */
  editing: SystemRole | null
}

const INITIAL_FILTERS: RoleFilters = {
  keyword: '',
}

/** 保存操作的输入：新建与编辑携带不同的表单契约；菜单授权走独立面板 */
type SaveRolePayload =
  | { mode: 'create'; input: SystemRoleCreateInput }
  | { mode: 'update'; roleCode: string; input: SystemRoleUpdateInput }

/** 删除目标：单个与批量共用，description 在打开确认框时生成 */
interface RoleDeleteTarget {
  roleCodes: string[]
  description: string
}

/** 删除角色的级联影响说明 */
/** 删除确认里的连带影响说明（i18n key，拼在删除文案之后） */
const DELETE_CASCADE_NOTE = 'system.role.deleteNote'

/**
 * 角色管理页的全部状态：查询条件、分页、列表数据、多选与新建/编辑/删除变更。
 *
 * 查询条件合成一个对象作为 queryKey，任一字段变化触发新请求；
 * 变更成功后失效列表缓存并关闭对话框。分配用户与菜单授权的目标角色
 * 只存于此，勾选/选择的临时状态由弹窗自己的 hook 管理。
 */
export function useRolesSync() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [draftKeywordState, setDraftKeyword] = useState('')
  const { queryState, updateQuery, resetQuery, setPage, setPageSize } =
    usePagedQueryState<RoleFilters>(INITIAL_FILTERS, PAGE_SIZE_OPTIONS[0])
  const [dialogState, setDialog] = useState<RoleDialogState>({
    open: false,
    editing: null,
  })
  const [deleteTargetState, setDeleteTarget] =
    useState<RoleDeleteTarget | null>(null)
  const [assignState, setAssign] = useState<SystemRole | null>(null)
  // 菜单授权面板的目标角色，弹窗自己的 use-role-menus-sync 管理勾选状态
  const [menusState, setMenus] = useState<SystemRole | null>(null)
  // 多选（跨页保留），键为角色编码
  const [selectedState, setSelected] = useState<Set<string>>(new Set())

  const query = useQuery({
    queryKey: ['system-roles', queryState],
    queryFn: () =>
      fetchSystemRoles({
        page: queryState.page,
        size: queryState.size,
        keyword: queryState.keyword || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['system-roles'] })

  const closeDialog = () => setDialog({ open: false, editing: null })

  /** 新建/更新角色本身；菜单授权在独立面板中单独保存 */
  const saveMutation = useMutation({
    mutationFn: async (payload: SaveRolePayload) =>
      payload.mode === 'create'
        ? createSystemRole(payload.input)
        : updateSystemRole(payload.roleCode, payload.input),
    onSuccess: (_, payload) => {
      toast.success(
        t(
          payload.mode === 'create'
            ? 'system.action.create'
            : 'system.action.update',
          { entity: t('system.entity.role') },
        ),
      )
      closeDialog()
      invalidateList()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  // 批量删除按编码逐个调用接口，全部完成后统一提示与刷新；
  // 单个删除也走这里，避免维护两套删除提示与刷新逻辑
  const deleteManyMutation = useBatchDeleteMutation({
    remove: deleteSystemRole,
    entityPluralKey: 'system.entity.rolePlural',
    onDeleted: () => {
      setDeleteTarget(null)
      setSelected(new Set())
      invalidateList()
    },
  })

  return {
    // 数据
    roles: query.data?.records ?? [],
    total: query.data?.total ?? 0,
    isFetchingState: query.isFetching,
    // 筛选与分页
    keywordState: draftKeywordState,
    setKeyword: setDraftKeyword,
    submitSearch: () => updateQuery({ keyword: draftKeywordState }),
    resetFilters: () => {
      setDraftKeyword('')
      resetQuery()
    },
    refresh: invalidateList,
    pageState: queryState.page,
    setPage,
    pageSizeState: queryState.size,
    setPageSize,
    // 新建 / 编辑
    dialogState,
    openCreate: () => setDialog({ open: true, editing: null }),
    openEdit: (role: SystemRole) => setDialog({ open: true, editing: role }),
    closeDialog,
    saveMutation,
    // 多选与批量删除
    selectedState,
    setSelected,
    selectedCount: selectedState.size,
    deleteManyMutation,
    // 删除确认（单个与批量共用）
    deleteTargetState,
    openDelete: (role: SystemRole) =>
      setDeleteTarget({
        roleCodes: [role.roleCode],
        description: `${t('system.role.deleteOne', {
          name: role.roleName,
          code: role.roleCode,
        })}\n${t(DELETE_CASCADE_NOTE)}`,
      }),
    openBatchDelete: (roleCodes: string[]) =>
      setDeleteTarget({
        roleCodes,
        description: `${t('system.role.deleteMany', { count: roleCodes.length })}\n${t(DELETE_CASCADE_NOTE)}`,
      }),
    closeDelete: () => setDeleteTarget(null),
    // 分配用户
    assignState,
    openAssign: setAssign,
    closeAssign: () => setAssign(null),
    // 菜单授权
    menusState,
    openMenus: setMenus,
    closeMenus: () => setMenus(null),
  }
}

export type RolesSyncState = ReturnType<typeof useRolesSync>
