import { useCallback, useMemo, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import {
  compareCellValue,
  nextSorting,
  readCellValue,
} from './grid-table-model'
import type { GridTableSort, GridTableSorting } from './types'

interface GridTableSortingOptions<TData extends object> {
  /** 受控排序；不传则在本地排序 */
  sorting: GridTableSorting | undefined
  data: TData[]
}

/**
 * 排序状态：受控时把变更交给业务侧，否则本地排序。
 * shift 点击在受控与本地模式下都追加多列排序。
 */
export function useGridTableSorting<TData extends object>({
  sorting,
  data,
}: GridTableSortingOptions<TData>) {
  const [localSortingState, setLocalSorting] = useState<GridTableSort[]>([])

  const sortingValue = sorting?.value ?? localSortingState

  const changeSorting = useCallback(
    (next: GridTableSort[]) => {
      if (sorting) sorting.onChange(next)
      else setLocalSorting(next)
    },
    [sorting],
  )

  const toggleSort = useCallback(
    (id: string, event: ReactMouseEvent<HTMLButtonElement>) => {
      changeSorting(nextSorting(sortingValue, id, event.shiftKey))
    },
    [changeSorting, sortingValue],
  )

  const sortedData = useMemo(() => {
    if (sorting || sortingValue.length === 0) return data
    return [...data].sort((a, b) => {
      for (const sort of sortingValue) {
        const result = compareCellValue(
          readCellValue(a, sort.id),
          readCellValue(b, sort.id),
        )
        if (result !== 0) return sort.desc ? -result : result
      }
      return 0
    })
  }, [sorting, data, sortingValue])

  return { sortingValue, toggleSort, sortedData }
}
