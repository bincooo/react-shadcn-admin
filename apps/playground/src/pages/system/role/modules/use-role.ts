import { useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SearchStatus } from '@/components/common/search-panel'
import { useBatchDeleteMutation } from '@/hooks/use-batch-delete-mutation'
import { usePagedQueryState } from '@/hooks/use-paged-query-state'
import {
  createRole,
  deleteRoles,
  fetchRoles,
  updateRole,
} from '@/api/system/role'
import type { Role, RoleCreateInput, RoleUpdateInput } from '@/api/system/role'
import { errorMessage } from '@/lib/format'

/** 角色列表启用状态筛选项映射：all → 省略 status */
function withRoleStatusParam(
  status: SearchStatus,
): 'ENABLED' | 'DISABLED' | undefined {
  if (status === 'all') return undefined
  return status === 'enabled' ? 'ENABLED' : 'DISABLED'
}

interface RoleFilters {
  keyword: string
  status: SearchStatus
}

interface RoleDialogProps {
  open: boolean
  /** 非空表示编辑该角色，空表示新建 */
  editing: Role | null
}

const INITIAL_FILTERS: RoleFilters = {
  keyword: '',
  status: 'all',
}

/** 保存操作的输入：新建与编辑携带不同的表单契约；菜单授权走独立面板 */
type SaveRolePayload =
  | { mode: 'create'; input: RoleCreateInput }
  | { mode: 'update'; roleId: string; input: RoleUpdateInput }

/** 删除目标：单个与批量共用，description 在打开确认框时生成 */
interface RoleDeleteTarget {
  roleIds: string[]
  description: string
}

/**
 * 角色管理页的全部状态：查询条件、分页、列表数据、多选与新建/编辑/删除变更。
 *
 * 查询条件合成一个对象作为 queryKey，任一字段变化触发新请求；
 * 变更成功后失效列表缓存并关闭对话框。分配用户与菜单授权的目标角色
 * 只存于此，勾选/选择的临时状态由弹窗自己的 hook 管理。
 */
export function useRole() {
  const queryClient = useQueryClient()
  const [draftKeywordState, setDraftKeyword] = useState('')
  const { queryState, updateQuery, resetQuery, setPage, setPageSize } =
    usePagedQueryState<RoleFilters>(INITIAL_FILTERS)
  const [dialog, setDialog] = useState<RoleDialogProps>({
    open: false,
    editing: null,
  })
  const [deleteTargetState, setDeleteTarget] =
    useState<RoleDeleteTarget | null>(null)
  const [assignState, setAssign] = useState<Role | null>(null)
  // 菜单授权面板的目标角色，弹窗自己的 use-permissions 管理勾选状态
  const [menusState, setMenus] = useState<Role | null>(null)
  // 多选（跨页保留），键为角色代理 id
  const [selectedState, setSelected] = useState<Set<string>>(new Set())

  const query = useQuery({
    queryKey: ['role', queryState],
    queryFn: () =>
      fetchRoles({
        page: queryState.page,
        size: queryState.size,
        keyword: queryState.keyword || undefined,
        status: withRoleStatusParam(queryState.status),
      }),
    placeholderData: keepPreviousData,
  })

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['role'] })

  /** 新建/更新角色本身；菜单授权在独立面板中单独保存 */
  const saveMutation = useMutation({
    mutationFn: async (payload: SaveRolePayload) =>
      payload.mode === 'create'
        ? createRole(payload.input)
        : updateRole(payload.roleId, payload.input),
    onSuccess: (_, payload) => {
      toast.success(payload.mode === 'create' ? '角色创建成功' : '角色已更新')
      setDialog({ open: false, editing: null })
      invalidateList()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  // 批量删除一次请求提交全部 id，单事务执行后统一提示与刷新；
  // 单个删除也走这里，避免维护两套删除提示与刷新逻辑
  const deleteManyMutation = useBatchDeleteMutation({
    removeMany: deleteRoles,
    entityLabel: '角色',
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
    isFetching: query.isFetching,
    // 筛选与分页
    keyword: draftKeywordState,
    setKeyword: setDraftKeyword,
    submitSearch: () => updateQuery({ keyword: draftKeywordState }),
    status: queryState.status,
    setStatus: (status: SearchStatus) => updateQuery({ status }),
    resetFilters: () => {
      setDraftKeyword('')
      resetQuery()
    },
    refresh: invalidateList,
    page: queryState.page,
    setPage,
    pageSize: queryState.size,
    setPageSize,
    // 新建 / 编辑
    dialog,
    openCreate: () => setDialog({ open: true, editing: null }),
    openEdit: (role: Role) => setDialog({ open: true, editing: role }),
    closeEdit: () => setDialog({ open: false, editing: null }),
    saveMutation,
    // 多选与批量删除
    selected: selectedState,
    setSelected,
    selectedCount: selectedState.size,
    deleteManyMutation,
    // 删除确认（单个与批量共用）
    deleteTarget: deleteTargetState,
    openDelete: (role: Role) =>
      setDeleteTarget({
        roleIds: [role.id],
        description: `确认删除角色「${role.roleName}」（${role.roleCode}）？\n该角色的用户分配与菜单授权会一并清除，删除后不可恢复。`,
      }),
    openBatchDelete: (roleIds: string[]) =>
      setDeleteTarget({
        roleIds,
        description: `${
          roleIds.length === 1
            ? '确认删除选中的角色？'
            : `确认删除选中的 ${roleIds.length} 个角色？`
        }\n该角色的用户分配与菜单授权会一并清除，删除后不可恢复。`,
      }),
    closeDelete: () => setDeleteTarget(null),
    // 分配用户
    assign: assignState,
    openAssign: setAssign,
    closeAssign: () => setAssign(null),
    // 菜单授权
    menus: menusState,
    openMenus: setMenus,
    closeMenus: () => setMenus(null),
  }
}

export type RoleState = ReturnType<typeof useRole>
