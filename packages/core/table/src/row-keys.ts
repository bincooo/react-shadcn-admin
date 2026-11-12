/** Traverse every record with its own parent-aware key and expansion predicate. */
export function collectExpandableRowKeys<TData extends Record<string, unknown>>(
  records: TData[],
  getKey: (record: TData, index: number, parentId?: string) => string,
  childrenColumn: string,
  canExpand?: (record: TData) => boolean,
): string[] {
  const keys: string[] = []
  const walk = (items: TData[], parentId?: string) => {
    items.forEach((record, index) => {
      const key = getKey(record, index, parentId)
      if (!canExpand || canExpand(record)) keys.push(key)
      const children = record[childrenColumn]
      if (Array.isArray(children)) walk(children as TData[], key)
    })
  }
  walk(records)
  return keys
}
