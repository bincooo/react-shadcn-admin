import { createContext, useContext, type ReactNode } from 'react'

/**
 * 表格内置文案。
 *
 * 组件库不绑定具体 i18n 框架：这里只声明文案形状并内置中/英两份，
 * 宿主应用通过 `TableLocaleProvider` 或 `locale` prop 覆盖。
 */
export interface TableLocale {
  /* ------------------------------ 选择列 ------------------------------ */
  selectionColumnTitle: string
  selectAllOnPage: string
  selectRow: string

  /* ------------------------------ 展开列 ------------------------------ */
  expandColumnTitle: string
  noExpandableDetail: string
  expandRowDetail: string
  collapseRowDetail: string
  expandTreeNode: string
  collapseTreeNode: string

  /* ------------------------------ 表格外壳 ------------------------------ */
  filterPrefix: string
  globalFilterPrefix: string
  clearFilters: string
  unbounded: string
  listSeparator: string
  selectedSummary: (count: number) => ReactNode
  selectionStrict: string
  selectionCascade: string
  clearSelection: string
  loading: string
  emptyText: string

  /* ------------------------------ 表头菜单 ------------------------------ */
  columnMenuLabel: (title: string) => string
  columnMenuTitle: string
  sortAscending: string
  sortDescending: string
  clearSorting: string
  pinLeft: string
  pinRight: string
  unpinLeft: string
  unpinRight: string
  unpin: string
  hideColumn: string

  /* ------------------------------ 分页 ------------------------------ */
  total: (start: number, end: number, total: number) => ReactNode
  previousPage: string
  nextPage: string
  jumpBackward: (pages: number) => string
  jumpForward: (pages: number) => string
  pageSize: (size: number) => string
  jumpTo: string
  pageSuffix: string

  /* ------------------------------ 筛选 ------------------------------ */
  filterColumnLabel: (title: string) => string
  filterThisColumn: string
  filterTitle: (title: string) => string
  selectAll: string
  deselectAll: string
  searchFilterOptions: string
  filterOptionsLabel: (title: string) => string
  noMatchingFilters: string
  searchColumnPlaceholder: (title: string) => string
  fuzzyMatchHint: string
  minValue: string
  maxValue: string
  startDate: string
  endDate: string
  unitHint: (unit: string) => string
  reset: string
  applyFilter: string

  /* ------------------------------ 列配置 ------------------------------ */
  columnSettings: string
  newGroup: string
  groupName: string
  editGroup: string
  dissolveGroupHint: string
  restoreDefaultsHint: string
  restoreDefaults: string
  selectAllColumns: string
  allColumns: string
  selectedCount: (visible: number, total: number) => string
  noConfigurableColumns: string
  cancel: string
  confirm: string
  dragToReorder: (title: string) => string
  dragReorderHint: string
  toggleColumnVisibility: (title: string) => string
  expandGroupLabel: (title: string) => string
  collapseGroupLabel: (title: string) => string
  editGroupLabel: (title: string) => string
  dissolveGroupLabel: (title: string) => string
}

export const zhLocale: TableLocale = {
  selectionColumnTitle: '选择',
  selectAllOnPage: '全选当页',
  selectRow: '选择此行',

  expandColumnTitle: '展开',
  noExpandableDetail: '该行无可展开明细',
  expandRowDetail: '展开行明细',
  collapseRowDetail: '收起行明细',
  expandTreeNode: '展开子节点',
  collapseTreeNode: '收起子节点',

  filterPrefix: '当前筛选：',
  globalFilterPrefix: '全局关键词',
  clearFilters: '清空筛选',
  unbounded: '不限',
  listSeparator: '、',
  selectedSummary: (count) => (
    <>
      已选择{' '}
      <strong className="text-primary font-semibold tabular-nums">
        {count}
      </strong>{' '}
      项记录
    </>
  ),
  selectionStrict: '严格独立模式',
  selectionCascade: '父子级联勾选模式',
  clearSelection: '取消选择',
  loading: '加载中 ...',
  emptyText: '暂无符合条件的表格数据',

  columnMenuLabel: (title) => `${title} 列菜单`,
  columnMenuTitle: '列菜单',
  sortAscending: '升序排列',
  sortDescending: '降序排列',
  clearSorting: '取消排序',
  pinLeft: '固定到左侧',
  pinRight: '固定到右侧',
  unpinLeft: '取消左固定',
  unpinRight: '取消右固定',
  unpin: '取消固定',
  hideColumn: '隐藏此列',

  total: (start, end, total) => (
    <>
      显示第{' '}
      <strong className="text-foreground font-medium">
        {start}-{end}
      </strong>{' '}
      条，共 <strong className="text-foreground font-medium">{total}</strong>{' '}
      条记录
    </>
  ),
  previousPage: '上一页',
  nextPage: '下一页',
  jumpBackward: (pages) => `向前 ${pages} 页`,
  jumpForward: (pages) => `向后 ${pages} 页`,
  pageSize: (size) => `${size} 条 / 页`,
  jumpTo: '跳至',
  pageSuffix: '页',

  filterColumnLabel: (title) => `筛选 ${title}`,
  filterThisColumn: '筛选此列',
  filterTitle: (title) => `筛选 · ${title}`,
  selectAll: '全选',
  deselectAll: '取消全选',
  searchFilterOptions: '在筛选项中搜索...',
  filterOptionsLabel: (title) => `${title} 筛选选项`,
  noMatchingFilters: '无匹配筛选项',
  searchColumnPlaceholder: (title) => `搜索 ${title}...`,
  fuzzyMatchHint: '支持模糊匹配，按 Enter 快速筛选',
  minValue: '最小值',
  maxValue: '最大值',
  startDate: '开始日期',
  endDate: '结束日期',
  unitHint: (unit) => `单位：${unit}（留空一侧表示不限上下界）`,
  reset: '重置',
  applyFilter: '筛选',

  columnSettings: '列配置',
  newGroup: '新建分组',
  groupName: '分组名称',
  editGroup: '编辑分组',
  dissolveGroupHint: '分解分组（子列提升到上一层）',
  restoreDefaultsHint: '立即恢复默认（列宽 / 顺序 / 固定 / 显隐 / 分组）',
  restoreDefaults: '恢复默认',
  selectAllColumns: '全选列',
  allColumns: '全部',
  selectedCount: (visible, total) => `已选 ${visible} / ${total}`,
  noConfigurableColumns: '暂无可配置的列',
  cancel: '取消',
  confirm: '确认',
  dragToReorder: (title) => `拖拽调整「${title}」顺序`,
  dragReorderHint: '拖拽调整顺序（拖到分组中央可放入分组）',
  toggleColumnVisibility: (title) => `切换「${title}」显示`,
  expandGroupLabel: (title) => `展开分组 ${title}`,
  collapseGroupLabel: (title) => `收起分组 ${title}`,
  editGroupLabel: (title) => `编辑分组 ${title}`,
  dissolveGroupLabel: (title) => `分解分组 ${title}`,
}

export const enLocale: TableLocale = {
  selectionColumnTitle: 'Select',
  selectAllOnPage: 'Select all rows on this page',
  selectRow: 'Select this row',

  expandColumnTitle: 'Expand',
  noExpandableDetail: 'No details to expand for this row',
  expandRowDetail: 'Expand row details',
  collapseRowDetail: 'Collapse row details',
  expandTreeNode: 'Expand child nodes',
  collapseTreeNode: 'Collapse child nodes',

  filterPrefix: 'Filters:',
  globalFilterPrefix: 'Keyword',
  clearFilters: 'Clear filters',
  unbounded: 'Any',
  listSeparator: ', ',
  selectedSummary: (count) => (
    <>
      Selected{' '}
      <strong className="text-primary font-semibold tabular-nums">
        {count}
      </strong>{' '}
      {count === 1 ? 'row' : 'rows'}
    </>
  ),
  selectionStrict: 'independent selection',
  selectionCascade: 'cascading selection',
  clearSelection: 'Clear selection',
  loading: 'Loading...',
  emptyText: 'No matching table data',

  columnMenuLabel: (title) => `${title} column menu`,
  columnMenuTitle: 'Column menu',
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
  clearSorting: 'Clear sorting',
  pinLeft: 'Pin to left',
  pinRight: 'Pin to right',
  unpinLeft: 'Unpin from left',
  unpinRight: 'Unpin from right',
  unpin: 'Unpin',
  hideColumn: 'Hide column',

  total: (start, end, total) => (
    <>
      Showing{' '}
      <strong className="text-foreground font-medium">
        {start}-{end}
      </strong>{' '}
      of <strong className="text-foreground font-medium">{total}</strong>{' '}
      records
    </>
  ),
  previousPage: 'Previous page',
  nextPage: 'Next page',
  jumpBackward: (pages) => `${pages} pages back`,
  jumpForward: (pages) => `${pages} pages forward`,
  pageSize: (size) => `${size} / page`,
  jumpTo: 'Go to',
  pageSuffix: 'page',

  filterColumnLabel: (title) => `Filter ${title}`,
  filterThisColumn: 'Filter this column',
  filterTitle: (title) => `Filter · ${title}`,
  selectAll: 'Select all',
  deselectAll: 'Clear all',
  searchFilterOptions: 'Search filter options...',
  filterOptionsLabel: (title) => `${title} filter options`,
  noMatchingFilters: 'No matching filter options',
  searchColumnPlaceholder: (title) => `Search ${title}...`,
  fuzzyMatchHint: 'Fuzzy matching; press Enter to apply',
  minValue: 'Min',
  maxValue: 'Max',
  startDate: 'Start date',
  endDate: 'End date',
  unitHint: (unit) => `Unit: ${unit} (leave one side empty for no bound)`,
  reset: 'Reset',
  applyFilter: 'Apply',

  columnSettings: 'Columns',
  newGroup: 'New group',
  groupName: 'Group name',
  editGroup: 'Edit group',
  dissolveGroupHint: 'Ungroup (move children up one level)',
  restoreDefaultsHint:
    'Restore defaults (width / order / pinning / visibility / groups)',
  restoreDefaults: 'Restore defaults',
  selectAllColumns: 'Select all columns',
  allColumns: 'All',
  selectedCount: (visible, total) => `${visible} / ${total} selected`,
  noConfigurableColumns: 'No configurable columns',
  cancel: 'Cancel',
  confirm: 'Confirm',
  dragToReorder: (title) => `Drag to reorder "${title}"`,
  dragReorderHint: 'Drag to reorder (drop at group center to nest)',
  toggleColumnVisibility: (title) => `Toggle "${title}" visibility`,
  expandGroupLabel: (title) => `Expand group ${title}`,
  collapseGroupLabel: (title) => `Collapse group ${title}`,
  editGroupLabel: (title) => `Edit group ${title}`,
  dissolveGroupLabel: (title) => `Ungroup ${title}`,
}

const TableLocaleContext = createContext<TableLocale>(zhLocale)

export function TableLocaleProvider({
  value,
  children,
}: {
  value: TableLocale
  children?: ReactNode
}) {
  return (
    <TableLocaleContext.Provider value={value}>
      {children}
    </TableLocaleContext.Provider>
  )
}

/** 读取最近的表格文案；没有 Provider 时回退到内置中文。 */
export function useTableLocale(): TableLocale {
  return useContext(TableLocaleContext)
}
