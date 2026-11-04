import { useCallback, useMemo, useState } from 'react'
import type { GridTableSelection } from './types'

interface GridTableSelectionOptions<TData extends object> {
  selection: GridTableSelection<TData> | undefined
  /** 多选功能是否生效（由 config.selection 与 features.selection 共同决定） */
  selectionEnabled: boolean
  /** 当前页数据（已排序） */
  data: TData[]
  getRowKey: (row: TData) => string
}

/**
 * 多选状态：选中集合由业务侧持有，这里只派生全选 / 半选并回传变更。
 * 不可选行（如当前登录账号）不参与勾选与计数。
 */
export function useGridTableSelection<TData extends object>({
  selection,
  selectionEnabled,
  data,
  getRowKey,
}: GridTableSelectionOptions<TData>) {
  const [selectVisibleState, setSelectVisible] = useState(true)

  const selectedKeys = selection?.selectedKeys
  const changeSelection = selection?.onChange
  const isRowSelectable = selection?.isRowSelectable

  const selectableRows = useMemo(
    () => (isRowSelectable ? data.filter((row) => isRowSelectable(row)) : data),
    [data, isRowSelectable],
  )

  const { allPageSelected, somePageSelected } = useMemo(() => {
    if (!selectionEnabled || !selectVisibleState || !selectedKeys?.size) {
      return { allPageSelected: false, somePageSelected: false }
    }
    return {
      allPageSelected:
        selectableRows.length > 0 &&
        selectableRows.every((row) => selectedKeys.has(getRowKey(row))),
      somePageSelected: selectableRows.some((row) =>
        selectedKeys.has(getRowKey(row)),
      ),
    }
  }, [
    getRowKey,
    selectableRows,
    selectedKeys,
    selectionEnabled,
    selectVisibleState,
  ])

  const clearSelection = useCallback(
    () => changeSelection?.(new Set()),
    [changeSelection],
  )

  const updateSelection = useCallback(
    (rows: Iterable<TData>, selected: boolean) => {
      if (!changeSelection) return
      const next = new Set(selectedKeys ?? [])
      for (const row of rows) {
        if (isRowSelectable && !isRowSelectable(row)) continue
        const key = getRowKey(row)
        if (selected) next.add(key)
        else next.delete(key)
      }
      changeSelection(next)
    },
    [changeSelection, getRowKey, isRowSelectable, selectedKeys],
  )

  const setRowSelected = useCallback(
    (row: TData, selected: boolean) => updateSelection([row], selected),
    [updateSelection],
  )

  const setPageSelected = useCallback(
    (selected: boolean) => updateSelection(data, selected),
    [data, updateSelection],
  )

  const setSelectable = useCallback(
    (visible: boolean) => {
      setSelectVisible(visible)
      if (!visible) clearSelection()
    },
    [clearSelection],
  )

  return {
    selectVisibleState,
    setSelectable,
    selectedKeys,
    selectedCount: selectedKeys?.size ?? 0,
    selectableRows,
    allPageSelected,
    somePageSelected,
    setRowSelected,
    setPageSelected,
    clearSelection,
  }
}
