import type { TanStackPaginationConfig } from '@repo/table'

/** 把服务端分页状态接到 `@repo/table` 默认分页条 */
export function withTablePagination({
  page,
  pageSize,
  total,
  setPage,
  setPageSize,
}: {
  page: number
  pageSize: number
  total: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
}): TanStackPaginationConfig {
  return {
    current: page,
    pageSize,
    total,
    onChange: (page, size) => {
      if (size !== pageSize) setPageSize(size)
      else setPage(page)
    },
  }
}
