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
import { fetchRoles } from '@/api/system/role'
import {
  createUser,
  deleteUsers,
  fetchUsers,
  resetUserPassword,
  updateUser,
} from '@/api/system/user'
import type { User, UserInput } from '@/api/system/user'
import { errorMessage } from '@/lib/format'
import { useAuthStore } from '@/store/auth'

/** 角色下拉的后备编码：角色接口未就绪时仍可编辑已有账号 */
export const ROLE_OPTIONS = ['admin', 'common'] as const

/** 用户列表启用状态筛选项映射：all → 省略 enabled */
function withEnabledParam(status: SearchStatus): boolean | undefined {
  if (status === 'all') return undefined
  return status === 'enabled'
}

interface UserFilters {
  keyword: string
  phone: string
  status: SearchStatus
}

interface UserDialogProps {
  open: boolean
  /** 非空表示编辑该用户，空表示新建 */
  editing: User | null
}

const INITIAL_FILTERS: UserFilters = {
  keyword: '',
  phone: '',
  status: 'all',
}

/**
 * 用户管理页的全部状态：查询条件、分页、表格数据与新建/编辑/删除变更。
 *
 * 查询条件合成一个对象作为 queryKey，任一字段变化触发新请求；
 * 变更成功后失效列表缓存并关闭对话框。
 */
export function useUser() {
  const queryClient = useQueryClient()
  // 当前登录账号不可删除（后端同样拒绝），表格据此隐藏删除入口
  const currentUserId = useAuthStore((s) => s.user?.id ?? null)
  const [draftKeywordState, setDraftKeyword] = useState('')
  const [draftPhoneState, setDraftPhone] = useState('')
  const { queryState, updateQuery, resetQuery, setPage, setPageSize } =
    usePagedQueryState<UserFilters>(INITIAL_FILTERS)
  const [dialog, setDialog] = useState<UserDialogProps>({
    open: false,
    editing: null,
  })
  // 只读详情抽屉（点击表格里的账号打开）
  const [detailState, setDetail] = useState<User | null>(null)
  // 重置密码对话框
  const [resetState, setReset] = useState<User | null>(null)
  // 多选（跨页保留）
  const [selectedState, setSelected] = useState<Set<string>>(new Set())

  const query = useQuery({
    queryKey: ['user', queryState],
    queryFn: () =>
      fetchUsers({
        page: queryState.page,
        size: queryState.size,
        keyword: queryState.keyword || undefined,
        phone: queryState.phone || undefined,
        enabled: withEnabledParam(queryState.status),
      }),
    placeholderData: keepPreviousData,
  })

  // 编辑抽屉的角色下拉以角色表为准，避免前端再维护编码/名称映射
  const roleOptionsQuery = useQuery({
    queryKey: ['role-option'],
    queryFn: () => fetchRoles({ page: 1, size: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['user'] })

  /** 新建或更新用户（id 为空表示新建），成功后关闭对话框并刷新列表 */
  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: UserInput }) =>
      id === null ? createUser(input) : updateUser(id, input),
    onSuccess: (_, { id }) => {
      toast.success(id === null ? '用户创建成功' : '用户已更新')
      setDialog({ open: false, editing: null })
      invalidateList()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(id, password),
    onSuccess: () => {
      toast.success('密码已重置')
      setReset(null)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  // 批量删除一次请求提交全部 id，单事务执行后统一提示与刷新
  const deleteManyMutation = useBatchDeleteMutation({
    removeMany: deleteUsers,
    entityLabel: '用户',
    onDeleted: () => {
      setSelected(new Set())
      invalidateList()
    },
  })

  // 勾选集合剔除当前登录账号（后端拒绝自删），剩余的才是可删除目标
  const deletableIds = [...selectedState].filter((id) => id !== currentUserId)

  return {
    // 数据
    users: query.data?.records ?? [],
    total: query.data?.total ?? 0,
    isFetching: query.isFetching,
    currentUserId,
    deletableIds,
    roleOptions: roleOptionsQuery.data?.records ?? [],
    // 筛选与分页
    keyword: draftKeywordState,
    setKeyword: setDraftKeyword,
    phone: draftPhoneState,
    setPhone: setDraftPhone,
    submitSearch: () =>
      updateQuery({ keyword: draftKeywordState, phone: draftPhoneState }),
    status: queryState.status,
    setStatus: (status: SearchStatus) => updateQuery({ status }),
    resetFilters: () => {
      setDraftKeyword('')
      setDraftPhone('')
      resetQuery()
    },
    refresh: invalidateList,
    page: queryState.page,
    setPage,
    pageSize: queryState.size,
    setPageSize,
    // 多选与批量删除
    selected: selectedState,
    setSelected,
    deleteManyMutation,
    // 对话框与变更
    dialog,
    openCreate: () => setDialog({ open: true, editing: null }),
    openEdit: (user: User) => setDialog({ open: true, editing: user }),
    closeEdit: () => setDialog({ open: false, editing: null }),
    detail: detailState,
    openDetail: (user: User) => setDetail(user),
    closeDetail: () => setDetail(null),
    reset: resetState,
    openReset: (user: User) => setReset(user),
    closeReset: () => setReset(null),
    resetPasswordMutation,
    saveMutation,
  }
}

export type UserState = ReturnType<typeof useUser>
