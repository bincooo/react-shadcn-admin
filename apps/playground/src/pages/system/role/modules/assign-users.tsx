import { useMemo, useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { UserAvatar } from '@/components/common/user-avatar'
import { StatusBadge } from '@/components/common/status-badge'
import { withTablePagination } from '@/lib/pagination'
import { SelectionField } from '@/components/common/selection-field'
import { SearchPanel, SearchTextField } from '@/components/common/search-panel'
import { usePagedQueryState } from '@/hooks/use-paged-query-state'
import { Button } from '@repo/ui/components/button'
import { Card } from '@repo/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import type { Role } from '@/api/system/role'
import { assignRoleUsers, fetchRoleUsers } from '@/api/system/role'
import type { User } from '@/api/system/user'
import { fetchUsers } from '@/api/system/user'
import { errorMessage } from '@/lib/format'
import type { RoleState } from './use-role'

/* ------------------------------- 弹窗状态 ------------------------------- */

/**
 * 分配用户弹窗的状态：左侧用户选择列表（服务端筛选/分页）与已选集合。
 *
 * 打开时并行拉取「该角色已分配用户」与「用户列表」；未操作时从服务端
 * 数据派生已选集合，编辑后以草稿为准。分配数据就绪之前不可修改或保存。
 * 勾选集合跨页、跨搜索保留，保存时按全量替换语义提交。
 */
function useRoleUsers(role: Role) {
  const queryClient = useQueryClient()
  const [draftSelectionState, setSelected] = useState<Set<string> | null>(null)
  // 搜索框输入与已应用的查询条件分开：提交后才作用于列表
  const [draftKeywordState, setDraftKeyword] = useState('')
  const { queryState, updateQuery, setPage, setPageSize } = usePagedQueryState<{
    keyword: string
  }>({ keyword: '' })
  const assignedQuery = useQuery({
    queryKey: ['role-user', role.id],
    queryFn: () => fetchRoleUsers(role.id),
    // 保存成功时主动失效该缓存；弹窗打开期间不因窗口聚焦重拉
    staleTime: Infinity,
  })

  const assignedIds = useMemo(
    () => new Set(assignedQuery.data?.map((user) => user.id) ?? []),
    [assignedQuery.data],
  )
  const selectedState = draftSelectionState ?? assignedIds

  const usersQuery = useQuery({
    queryKey: [
      'user-picker',
      queryState.page,
      queryState.size,
      queryState.keyword,
    ],
    queryFn: () =>
      fetchUsers({
        page: queryState.page,
        size: queryState.size,
        keyword: queryState.keyword || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const saveMutation = useMutation({
    mutationFn: (userIds: string[]) => assignRoleUsers(role.id, userIds),
    onSuccess: (_, userIds) => {
      toast.success(
        `已更新「${role.roleName}」的用户授权（${userIds.length} 人）`,
      )
      queryClient.invalidateQueries({
        queryKey: ['role-user', role.id],
      })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return {
    // 用户列表
    users: usersQuery.data?.records ?? [],
    total: usersQuery.data?.total ?? 0,
    loadingState: usersQuery.isFetching,
    // 已分配用户初始化
    assignedReadyState: assignedQuery.isSuccess,
    assignedErrorState: assignedQuery.isError,
    retryAssigned: () => void assignedQuery.refetch(),
    // 勾选集合（表格 onChange 会与现有集合合并，跨页保留）
    selected: selectedState,
    selectedCount: selectedState.size,
    setSelected,
    // 筛选与分页
    keyword: draftKeywordState,
    setKeyword: setDraftKeyword,
    submitSearch: () => updateQuery({ keyword: draftKeywordState }),
    resetSearch: () => {
      setDraftKeyword('')
      updateQuery({ keyword: '' })
    },
    page: queryState.page,
    setPage,
    pageSize: queryState.size,
    setPageSize,
    // 保存
    saveMutation,
  }
}

/* ------------------------------- 分配用户 ------------------------------- */

/**
 * 分配用户弹窗：用户列表走 `/api/users` 服务端筛选与分页，
 * 已分配用户预勾选，保存时按当前勾选全量替换。
 * 列表渲染与「选择角色」面板同构（TanStackTable + 表头已选/清空 + 分页）。
 */
export function AssignUsersDialog({
  role,
  roleMgr,
}: {
  role: Role | null
  roleMgr: RoleState
}) {
  return (
    <Dialog
      open={role !== null}
      onOpenChange={(open) => {
        if (!open) roleMgr.closeAssign()
      }}
    >
      {role && (
        <AssignUsersDialogContent
          key={role.id}
          role={role}
          onClose={roleMgr.closeAssign}
        />
      )}
    </Dialog>
  )
}

function AssignUsersDialogContent({
  role,
  onClose,
}: {
  role: Role
  onClose: () => void
}) {
  const usersState = useRoleUsers(role)
  const pendingState = usersState.saveMutation.isPending
  const selectionReady = usersState.assignedReadyState && !pendingState
  const [submittedState, setSubmitted] = useState(false)
  const selectionInvalid = submittedState && usersState.selectedCount === 0

  const columns: TanStackColumnsType<User> = [
    {
      title: '账号',
      dataIndex: 'username',
      sorter: true,
      filterMode: 'search',
      width: 180,
      minWidth: 140,
      render: (_, { nickname, username, avatar, enabled }) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={nickname ?? username} avatar={avatar} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">
              {nickname ?? username}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              @{username}
              {enabled ? '' : ' · 停用'}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      sorter: true,
      filterMode: 'search',
      width: 140,
      minWidth: 110,
      render: (_, { phone }) => (
        <span className="text-[12.5px] tabular-nums">{phone ?? '—'}</span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      sorter: true,
      filterMode: 'search',
      width: 200,
      minWidth: 140,
      render: (_, { email }) => (
        <span className="truncate text-[12.5px] text-muted-foreground">
          {email ?? '—'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      sorter: true,
      filterMode: 'menu',
      filterMultiple: false,
      filters: [
        { text: '启用', value: true },
        { text: '停用', value: false },
      ],
      width: 100,
      minWidth: 80,
      render: (_, { enabled }) => <StatusBadge enabled={enabled} />,
    },
  ]

  const save = () => {
    if (!selectionReady) return
    setSubmitted(true)
    if (usersState.selectedCount === 0) return
    usersState.saveMutation.mutate([...usersState.selected], {
      onSuccess: onClose,
    })
  }

  return (
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-3xl">
      <DialogHeader className="shrink-0">
        <DialogTitle>{'分配用户'}</DialogTitle>
        <DialogDescription>
          {`为角色「${role.roleName}」选择用户，保存后按当前勾选全量替换。`}
        </DialogDescription>
      </DialogHeader>

      <div
        data-slot="dialog-scroll-body"
        className="-mx-1 flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto overscroll-contain px-1 py-1"
      >
        <div className="shrink-0">
          <SearchPanel
            onSearch={usersState.submitSearch}
            onReset={usersState.resetSearch}
          >
            <SearchTextField
              className="w-52.5"
              ariaLabel={'搜索用户'}
              value={usersState.keyword}
              placeholder={'账号 / 昵称 / 手机号'}
              onChange={usersState.setKeyword}
              onSearch={usersState.submitSearch}
            />
          </SearchPanel>
        </div>

        {usersState.assignedErrorState && (
          <div
            role="alert"
            className="flex shrink-0 items-center gap-2 text-sm text-destructive"
          >
            <span>{'已分配用户加载失败，无法保存。'}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={usersState.retryAssigned}
            >
              {'重试'}
            </Button>
          </div>
        )}

        <div className="shrink-0">
          <SelectionField
            label={'分配用户'}
            error={selectionInvalid ? '请至少选择一个用户' : undefined}
            errorId="role-assign-users-error"
          >
            <Card className="gap-0 py-0">
              <TanStackTable
                stickyHeader
                scroll={{ virtual: true, y: 480 }}
                columns={columns}
                dataSource={usersState.users}
                rowKey="id"
                filterDisplay="row"
                pagination={withTablePagination(usersState)}
                loading={usersState.loadingState}
                selection={{
                  selectedRowKeys: [...usersState.selected],
                  onChange: (keys) => usersState.setSelected(new Set(keys)),
                  getCheckboxProps: () => ({ disabled: !selectionReady }),
                  fixed: true,
                }}
              />
            </Card>
          </SelectionField>
        </div>
      </div>

      <DialogFooter className="shrink-0">
        <Button variant="outline" onClick={onClose}>
          {'取消'}
        </Button>
        <Button onClick={save} disabled={!selectionReady}>
          {'保存'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
