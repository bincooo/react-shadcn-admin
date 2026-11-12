import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { SearchPanel, SearchTextField } from '@/components/common/search-panel'
import { SelectionField } from '@/components/common/selection-field'
import { withTablePagination } from '@/lib/pagination'
import { Badge } from '@repo/ui/components/badge'
import { Card } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { usePagedQueryState } from '@/hooks/use-paged-query-state'
import { fetchRoles } from '@/api/system/role'
import type { Role } from '@/api/system/role'
import { cn } from '@/lib/utils'

/* ------------------------------- 选择状态 ------------------------------- */

/** 可选角色：编码用于提交，名称用于展示 */
interface RoleOption {
  code: string
  name: string
}

interface RolePickerOptions {
  /** 首批角色（父级角色下拉缓存），用于弹窗打开前的名称展示 */
  seedOptions: RoleOption[]
  value: string[]
  onChange: (roles: string[]) => void
}

/**
 * 角色多选的弹窗状态：查询、筛选、分页与草稿勾选。
 *
 * 草稿只在弹窗打开时从当前值初始化，确认后才回填；勾选时顺手记住名称，
 * 翻页/改筛选后触发框仍能展示名称。组件只保留触发框与弹窗渲染。
 */
function useRolePicker({ seedOptions, value, onChange }: RolePickerOptions) {
  const [openState, setOpen] = useState(false)
  const [draftState, setDraft] = useState<string[]>(value)
  const [selectedNamesState, setSelectedNames] = useState<Map<string, string>>(
    new Map(),
  )
  // 单一搜索框：同时匹配角色编码与名称；提交后才作用于查询
  const [draftKeywordState, setDraftKeyword] = useState('')
  const { queryState, updateQuery, setPage, setPageSize } = usePagedQueryState<{
    keyword: string
  }>({ keyword: '' })

  const rolesQuery = useQuery({
    queryKey: [
      'role-picker',
      queryState.page,
      queryState.size,
      queryState.keyword,
    ],
    queryFn: () =>
      fetchRoles({
        page: queryState.page,
        size: queryState.size,
        keyword: queryState.keyword || undefined,
      }),
    enabled: openState,
    placeholderData: keepPreviousData,
  })

  // 名称来源：父级首批缓存 + 当前页结果 + 勾选时记住的名称
  const nameByCode = useMemo(() => {
    const map = new Map(seedOptions.map((role) => [role.code, role.name]))
    for (const role of rolesQuery.data?.records ?? []) {
      map.set(role.roleCode, role.roleName)
    }
    for (const [code, name] of selectedNamesState) map.set(code, name)
    return map
  }, [seedOptions, rolesQuery.data, selectedNamesState])

  const openDialog = () => {
    setDraft([...value])
    setDraftKeyword('')
    updateQuery({ keyword: '' })
    setOpen(true)
  }

  /** 触发框内直接移除某个角色（不打开弹窗） */
  const removeRole = (code: string) =>
    onChange(value.filter((role) => role !== code))

  /** 勾选变化：同步草稿，并记住新选中项的名称供跨页展示 */
  const handleSelectionChange = (keys: Set<string>) => {
    const next = [...keys]
    setDraft(next)
    const added = next.filter((code) => !draftState.includes(code))
    if (added.length === 0) return
    const pageRoles = rolesQuery.data?.records ?? []
    setSelectedNames((prev) => {
      const map = new Map(prev)
      for (const code of added) {
        const role = pageRoles.find((candidate) => candidate.roleCode === code)
        if (role) map.set(code, role.roleName)
      }
      return map
    })
  }

  const applyFilters = () => {
    updateQuery({ keyword: draftKeywordState.trim() })
  }

  const resetFilters = () => {
    setDraftKeyword('')
    updateQuery({ keyword: '' })
  }

  const confirm = () => {
    onChange(draftState)
    setOpen(false)
  }

  return {
    open: openState,
    openDialog,
    setOpen,
    confirm,
    draft: draftState,
    handleSelectionChange,
    draftKeyword: draftKeywordState,
    setDraftKeyword,
    applyFilters,
    resetFilters,
    page: queryState.page,
    setPage,
    pageSize: queryState.size,
    setPageSize,
    total: rolesQuery.data?.total ?? 0,
    rolesQuery,
    pageRoles: rolesQuery.data?.records ?? [],
    nameByCode,
    removeRole,
  }
}

/* ------------------------------- 多选控件 ------------------------------- */

interface RoleMultiSelectProps {
  /** 触发按钮 id，供 FormField 的 label 关联 */
  id: string
  /** 首批角色（父级角色下拉缓存），用于弹窗打开前的名称展示 */
  seedOptions: RoleOption[]
  value: string[]
  onChange: (roles: string[]) => void
  invalid?: boolean
  describedBy?: string
}

/**
 * 角色多选：输入框样式的触发按钮 + 可筛选、分页的表格弹窗。
 *
 * 触发按钮与普通输入框同高（h-8）；已选标签内的删除图标可直接移除，
 * 其余区域点击打开弹窗。弹窗内勾选先写入草稿，点「确认」才回填表单；
 * 取消/点击遮罩关闭不改变已选值。勾选集合跨页保留，确认时只回传角色编码。
 */
export function RoleMultiSelect({
  id,
  seedOptions,
  value,
  onChange,
  invalid,
  describedBy,
}: RoleMultiSelectProps) {
  const picker = useRolePicker({ seedOptions, value, onChange })
  const [submittedState, setSubmitted] = useState(false)
  const selectionInvalid = submittedState && picker.draft.length === 0

  const setPickerOpen = (open: boolean) => {
    if (!open) setSubmitted(false)
    picker.setOpen(open)
  }

  const confirmSelection = () => {
    setSubmitted(true)
    if (picker.draft.length === 0) return
    picker.confirm()
    setSubmitted(false)
  }

  const columns: TanStackColumnsType<Role> = [
    {
      title: '角色编码',
      dataIndex: 'roleCode',
      sorter: true,
      filterMode: 'search',
      width: 80,
      minWidth: 80,
      render: (_, role) => (
        <span className="font-mono text-[12.5px]">{role.roleCode}</span>
      ),
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      sorter: true,
      filterMode: 'search',
      width: 80,
      minWidth: 80,
    },
    {
      title: '描述',
      dataIndex: 'description',
      sorter: true,
      filterMode: 'search',
    },
  ]

  return (
    <>
      <div
        className={cn(
          'relative flex h-8 w-full items-center rounded-lg border bg-transparent transition-colors dark:bg-input/30',
          invalid
            ? 'border-destructive ring-3 ring-destructive/20 focus-within:border-destructive dark:border-destructive/50 dark:ring-destructive/40 dark:focus-within:border-destructive/50'
            : 'border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        )}
        title={value
          .map((code) => picker.nameByCode.get(code) ?? code)
          .join(', ')}
      >
        <button
          id={id}
          type="button"
          aria-label={'角色'}
          aria-haspopup="dialog"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="absolute inset-0 rounded-lg outline-none"
          onClick={picker.openDialog}
        />
        <span className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-1 overflow-hidden px-2.5">
          {value.length > 0 ? (
            value.map((code) => (
              <Badge
                key={code}
                variant="secondary"
                className="gap-1 bg-primary/10 pr-1 text-[12px] text-primary"
              >
                {picker.nameByCode.get(code) ?? code}
                <button
                  type="button"
                  aria-label={`移除角色 ${picker.nameByCode.get(code) ?? code}`}
                  className="pointer-events-auto outline-none hover:bg-foreground/10"
                  onClick={() => picker.removeRole(code)}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            ))
          ) : (
            <span className="truncate text-[13px] text-muted-foreground">
              {'请选择'}
            </span>
          )}
        </span>
        <Search
          className="pointer-events-none relative z-10 mr-2.5 size-3 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <Dialog open={picker.open} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{'选择角色'}</DialogTitle>
          </DialogHeader>

          <div
            data-slot="dialog-scroll-body"
            className="-mx-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain px-1 py-1"
          >
            <div className="shrink-0">
              <SearchPanel
                onSearch={picker.applyFilters}
                onReset={picker.resetFilters}
              >
                <SearchTextField
                  className="w-52.5"
                  ariaLabel={'角色编码/名称'}
                  value={picker.draftKeyword}
                  placeholder={'角色编码/名称'}
                  onChange={picker.setDraftKeyword}
                  onSearch={picker.applyFilters}
                  autoComplete="off"
                />
              </SearchPanel>
            </div>

            <div className="shrink-0">
              <SelectionField
                label={'选择角色'}
                error={selectionInvalid ? '请至少选择一个角色' : undefined}
                errorId={`${id}-picker-error`}
              >
                <Card className="gap-0 py-0">
                  <TanStackTable
                    stickyHeader
                    scroll={{ virtual: true, y: 480 }}
                    columns={columns}
                    dataSource={picker.pageRoles}
                    rowKey="roleCode"
                    filterDisplay="row"
                    pagination={withTablePagination(picker)}
                    loading={picker.rolesQuery.isFetching}
                    selection={{
                      selectedRowKeys: picker.draft,
                      onChange: (keys) =>
                        picker.handleSelectionChange(new Set(keys)),
                      fixed: true,
                    }}
                  />
                </Card>
              </SelectionField>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerOpen(false)}
            >
              {'取消'}
            </Button>
            <Button
              type="button"
              disabled={picker.rolesQuery.isLoading}
              onClick={confirmSelection}
            >
              {'确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
