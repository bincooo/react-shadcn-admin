import type { GridTablePagination } from '@/components/core/grid-table'

/**
 * 每页条数选项（首个为默认值，与 `usePagedQueryState` 的初始 size 一致）。
 *
 * 与 grid-table 的 `DEFAULT_PAGE_SIZE_OPTIONS` 不同：这里不带 100。系统管理
 * 的列表以「几十行」为主，100 条一页会让选中态与滚动位置都难以把握；grid-table
 * 的默认值服务于组件演示页那种需要观察长列表的场景。两处取值不同是刻意的，
 * 改任意一处前先确认另一处不需要同步。
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50]

/** 选中胶囊 portal 的挂载容器：挂在应用容器内以继承主题与布局上下文 */
export function getAppContainer(): HTMLElement | null {
  return document.querySelector('#app-container')
}

/** 由业务分页状态生成 GridTable 的受控分页配置 */
export function toPaginationConfig({
  pageState,
  pageSizeState,
  total,
  setPage,
  setPageSize,
}: {
  pageState: number
  pageSizeState: number
  total: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
}): GridTablePagination {
  return {
    page: pageState,
    pageSize: pageSizeState,
    total,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  }
}
