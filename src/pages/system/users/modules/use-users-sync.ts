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
  createSystemUser,
  deleteSystemUser,
  fetchSystemUsers,
  resetSystemUserPassword,
  updateSystemUser,
} from '@/api/system/user'
import type { SystemUser, SystemUserInput } from '@/api/system/user'
import { errorMessage } from '@/lib/format'
import { useAuthStore } from '@/store/auth'

/** 可分配的角色编码（后端种子角色） */
export const ROLE_OPTIONS = ['admin', 'common'] as const

/** 角色编码 → i18n 词条 key；未知编码由调用方原样展示 */
export const ROLE_LABEL_KEYS: Record<string, string> = {
  admin: 'role.admin',
  common: 'role.common',
}

/** 启用状态筛选：`all` 表示不过滤（接口约定省略 enabled 参数） */
export type StatusFilter = 'all' | 'enabled' | 'disabled'

interface UserFilters {
  keyword: string
  phone: string
  status: StatusFilter
}

interface DialogState {
  open: boolean
  /** 非空表示编辑该用户，空表示新建 */
  editing: SystemUser | null
}

const INITIAL_FILTERS: UserFilters = {
  keyword: '',
  phone: '',
  status: 'all',
}

/** 筛选状态 → 接口的 enabled 参数（all 视为不过滤） */
function toEnabledParam(status: StatusFilter): boolean | undefined {
  if (status === 'all') return undefined
  return status === 'enabled'
}

/**
 * 用户管理页的全部状态：查询条件、分页、表格数据与新建/编辑/删除变更。
 *
 * 查询条件合成一个对象作为 queryKey，任一字段变化触发新请求；
 * 变更成功后失效列表缓存并关闭对话框。
 */
export function useUsersSync() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // 当前登录账号不可删除（后端同样拒绝），表格据此隐藏删除入口
  const currentUserId = useAuthStore((s) => s.user?.id ?? null)
  const [draftKeywordState, setDraftKeyword] = useState('')
  const [draftPhoneState, setDraftPhone] = useState('')
  const { queryState, updateQuery, resetQuery, setPage, setPageSize } =
    usePagedQueryState<UserFilters>(INITIAL_FILTERS, PAGE_SIZE_OPTIONS[0])
  const [dialogState, setDialog] = useState<DialogState>({
    open: false,
    editing: null,
  })
  // 只读详情抽屉（点击表格里的账号打开）
  const [detailState, setDetail] = useState<SystemUser | null>(null)
  // 重置密码对话框
  const [resetState, setReset] = useState<SystemUser | null>(null)
  // 多选（跨页保留）
  const [selectedState, setSelected] = useState<Set<string>>(new Set())

  const query = useQuery({
    queryKey: ['system-users', queryState],
    queryFn: () =>
      fetchSystemUsers({
        page: queryState.page,
        size: queryState.size,
        keyword: queryState.keyword || undefined,
        phone: queryState.phone || undefined,
        enabled: toEnabledParam(queryState.status),
      }),
    placeholderData: keepPreviousData,
  })

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['system-users'] })

  const closeDialog = () => setDialog({ open: false, editing: null })

  /** 新建或更新用户（id 为空表示新建），成功后关闭对话框并刷新列表 */
  const saveMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string | null
      input: SystemUserInput
    }) => (id === null ? createSystemUser(input) : updateSystemUser(id, input)),
    onSuccess: (_, { id }) => {
      toast.success(
        t(id === null ? 'system.action.create' : 'system.action.update', {
          entity: t('system.entity.user'),
        }),
      )
      closeDialog()
      invalidateList()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetSystemUserPassword(id, password),
    onSuccess: () => {
      toast.success(t('system.user.passwordReset'))
      setReset(null)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  // 批量删除按 id 逐个调用接口，全部完成后统一提示与刷新
  const deleteManyMutation = useBatchDeleteMutation({
    remove: deleteSystemUser,
    entityPluralKey: 'system.entity.userPlural',
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
    isFetchingState: query.isFetching,
    currentUserId,
    deletableIds,
    // 筛选与分页
    keywordState: draftKeywordState,
    setKeyword: setDraftKeyword,
    phoneState: draftPhoneState,
    setPhone: setDraftPhone,
    submitSearch: () =>
      updateQuery({ keyword: draftKeywordState, phone: draftPhoneState }),
    statusState: queryState.status,
    setStatus: (status: StatusFilter) => updateQuery({ status }),
    resetFilters: () => {
      setDraftKeyword('')
      setDraftPhone('')
      resetQuery()
    },
    refresh: invalidateList,
    pageState: queryState.page,
    setPage,
    pageSizeState: queryState.size,
    setPageSize,
    // 多选与批量删除
    selectedState,
    setSelected,
    deleteManyMutation,
    // 对话框与变更
    dialogState,
    openCreate: () => setDialog({ open: true, editing: null }),
    openEdit: (user: SystemUser) => setDialog({ open: true, editing: user }),
    closeDialog,
    detailState,
    openDetail: (user: SystemUser) => setDetail(user),
    closeDetail: () => setDetail(null),
    resetState,
    openReset: (user: SystemUser) => setReset(user),
    closeReset: () => setReset(null),
    resetPasswordMutation,
    saveMutation,
  }
}

export type UsersSyncState = ReturnType<typeof useUsersSync>
