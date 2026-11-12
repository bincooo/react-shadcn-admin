import { useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePagedQueryState } from '@/hooks/use-paged-query-state'
import { errorMessage } from '@/lib/format'
import {
  createDemoItem,
  deleteDemoItem,
  fetchDemoItemPage,
  updateDemoItem,
} from '../api'
import type { DemoItem, DemoItemInput } from '../types'

interface DemoItemFilters {
  keyword: string
}

interface DemoItemDialogState {
  open: boolean
  /** 非空表示编辑该记录，空表示新建 */
  editing: DemoItem | null
}

const INITIAL_FILTERS: DemoItemFilters = { keyword: '' }

/** 演示明细列表状态：查询条件、分页、弹窗与增删改变更。 */
export function useDemoItem() {
  const queryClient = useQueryClient()
  const [draftKeyword, setKeyword] = useState('')
  const { queryState, updateQuery, resetQuery, setPage, setPageSize } =
    usePagedQueryState<DemoItemFilters>(INITIAL_FILTERS)
  const [dialog, setDialog] = useState<DemoItemDialogState>({
    open: false,
    editing: null,
  })
  const [deleting, setDeleting] = useState<DemoItem | null>(null)

  const query = useQuery({
    queryKey: ['demoItem', queryState],
    queryFn: () =>
      fetchDemoItemPage({
        page: queryState.page,
        size: queryState.size,
        keyword: queryState.keyword || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['demoItem'] })

  /** 新建或更新（id 为空表示新建），成功后关闭弹窗并刷新列表 */
  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: DemoItemInput }) =>
      id === null ? createDemoItem(input) : updateDemoItem(id, input),
    onSuccess: (_, { id }) => {
      toast.success(id === null ? '创建成功' : '更新成功')
      setDialog({ open: false, editing: null })
      invalidateList()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDemoItem(id),
    onSuccess: () => {
      toast.success('删除成功')
      setDeleting(null)
      invalidateList()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return {
    records: query.data?.records ?? [],
    total: query.data?.total ?? 0,
    isFetching: query.isFetching,
    keyword: draftKeyword,
    setKeyword,
    submitSearch: () => updateQuery({ keyword: draftKeyword }),
    resetFilters: () => {
      setKeyword('')
      resetQuery()
    },
    refresh: invalidateList,
    page: queryState.page,
    setPage,
    pageSize: queryState.size,
    setPageSize,
    dialog,
    openCreate: () => setDialog({ open: true, editing: null }),
    openEdit: (record: DemoItem) => setDialog({ open: true, editing: record }),
    closeDialog: () => setDialog({ open: false, editing: null }),
    deleting,
    requestDelete: (record: DemoItem) => setDeleting(record),
    closeDelete: () => setDeleting(null),
    saveMutation,
    deleteMutation,
  }
}

export type DemoItemState = ReturnType<typeof useDemoItem>
