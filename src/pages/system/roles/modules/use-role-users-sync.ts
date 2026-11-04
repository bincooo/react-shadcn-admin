import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { assignSystemRoleUsers, fetchSystemRoleUsers } from '@/api/system/role'
import { fetchSystemUsers } from '@/api/system/user'
import type { SystemRole } from '@/api/system/role'
import { errorMessage } from '@/lib/format'

/** 用户选择列表的每页条数 */
const USER_PICKER_PAGE_SIZE = 10

/**
 * 分配用户弹窗的状态：左侧用户选择列表（服务端筛选/分页）与已选集合。
 *
 * 打开时并行拉取「该角色已分配用户」与「用户列表」；已分配用户到达后
 * 只初始化一次勾选集合，之后用户在当前列表中的勾选不再被后台刷新覆盖。
 * 勾选集合跨页、跨搜索保留，保存时按全量替换语义提交。
 */
export function useRoleUsersSync(role: SystemRole) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedState, setSelected] = useState<Set<string>>(new Set())
  const [draftKeywordState, setDraftKeyword] = useState('')
  const [appliedKeywordState, setAppliedKeyword] = useState('')
  const [pageState, setPage] = useState(1)
  // 已分配用户只在弹窗挂载后初始化一次，避免后台刷新清掉用户的新勾选
  const initializedRef = useRef(false)

  const assignedQuery = useQuery({
    queryKey: ['system-role-users', role.roleCode],
    queryFn: () => fetchSystemRoleUsers(role.roleCode),
    // 保存成功时主动失效该缓存；弹窗打开期间不因窗口聚焦重拉
    staleTime: Infinity,
  })

  useEffect(() => {
    if (initializedRef.current || !assignedQuery.data) return
    initializedRef.current = true
    setSelected(new Set(assignedQuery.data.map((user) => user.id)))
  }, [assignedQuery.data])

  const usersQuery = useQuery({
    queryKey: ['system-users-picker', pageState, appliedKeywordState],
    queryFn: () =>
      fetchSystemUsers({
        page: pageState,
        size: USER_PICKER_PAGE_SIZE,
        keyword: appliedKeywordState || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  /** 勾选/取消勾选单个用户（跨页保留） */
  const toggleUser = (userId: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(userId)
      } else {
        next.delete(userId)
      }
      return next
    })

  const saveMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      assignSystemRoleUsers(role.roleCode, userIds),
    onSuccess: (_, userIds) => {
      toast.success(
        t('system.role.assignSaved', {
          name: role.roleName,
          count: userIds.length,
        }),
      )
      queryClient.invalidateQueries({
        queryKey: ['system-role-users', role.roleCode],
      })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return {
    // 用户列表
    users: usersQuery.data?.records ?? [],
    total: usersQuery.data?.total ?? 0,
    totalPages: Math.max(usersQuery.data?.totalPages ?? 1, 1),
    // 已分配用户初始化
    assignedLoadingState: assignedQuery.isLoading,
    // 勾选集合
    selectedState,
    selectedCount: selectedState.size,
    toggleUser,
    // 筛选与分页
    keywordState: draftKeywordState,
    setKeyword: setDraftKeyword,
    submitSearch: () => {
      setAppliedKeyword(draftKeywordState)
      setPage(1)
    },
    resetSearch: () => {
      setDraftKeyword('')
      setAppliedKeyword('')
      setPage(1)
    },
    pageState,
    setPage,
    // 保存
    saveMutation,
  }
}
