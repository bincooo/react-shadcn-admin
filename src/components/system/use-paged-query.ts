import { useState } from 'react'

/**
 * 分页查询状态：筛选条件与 page/size 合成一个受控对象。
 * 修改筛选或每页条数时统一回到第一页；resetQuery 恢复初始条件。
 */
export function usePagedQueryState<TFilter extends object>(
  initialFilter: TFilter,
  pageSize: number,
) {
  type Query = TFilter & { page: number; size: number }
  const [queryState, setQuery] = useState<Query>(() => ({
    ...initialFilter,
    page: 1,
    size: pageSize,
  }))

  const updateQuery = (changes: Partial<Query>) =>
    setQuery((prev) => ({ ...prev, ...changes, page: 1 }))

  return {
    queryState,
    updateQuery,
    resetQuery: () => setQuery({ ...initialFilter, page: 1, size: pageSize }),
    setPage: (page: number) => setQuery((prev) => ({ ...prev, page })),
    setPageSize: (size: number) =>
      setQuery((prev) => ({ ...prev, size, page: 1 })),
  }
}
