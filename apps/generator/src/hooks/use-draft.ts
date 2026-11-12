import { useCallback, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { createDraft, ensureAuditColumns, toCamel } from '@/lib/defaults'
import { notifyError } from '@/lib/notify'
import type {
  DetailTableDefinition,
  GeneratorOptions,
  TableDefinition,
  TableSummary,
} from '@/types'

/** 未保存修改时离开页面给出确认 */
function confirmDiscard(dirty: boolean) {
  return !dirty || window.confirm('当前修改尚未保存，确定放弃并继续吗？')
}

/** 新建草稿：与已有表重名时自动追加序号 */
export function uniqueDraft(tables: TableSummary[]): TableDefinition {
  const draft = createDraft()
  let index = tables.length + 1
  let name = draft.name
  while (tables.some((table) => table.name === name)) {
    name = `${draft.name}_${index}`
    index += 1
  }
  if (name === draft.name) return draft
  const suffix = name.split('_').at(-1) ?? ''
  const entityName = `Demo${suffix}`
  return {
    ...draft,
    name,
    entityName,
    module: toCamel(entityName),
    displayName: `示例业务 ${suffix}`,
    options: {
      ...draft.options,
      permissionPrefix: `system:${toCamel(entityName)}`,
    },
  }
}

/**
 * 表定义草稿：加载、编辑、切换与新建。
 *
 * 只管理草稿数据本身；保存、删除、下载等带 busy/toast 的编排留在页面里，
 * 避免把跨模块副作用塞进 hook。
 */
export function useDraft(tables: TableSummary[]) {
  const [draft, setDraft] = useState<TableDefinition | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(false)
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  const load = useCallback(async (name: string, force = false) => {
    if (!force && !confirmDiscard(dirtyRef.current)) return false
    setLoading(true)
    try {
      const definition = await api.getTable(name)
      setDraft(definition)
      setSelectedName(definition.name)
      setDirty(false)
      return true
    } catch (error) {
      notifyError(error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const patch = useCallback((patch: Partial<TableDefinition>) => {
    setDraft((previous) => {
      if (!previous) return previous
      const next = { ...previous, ...patch }
      if (patch.module != null) {
        const previousDefault = `system:${previous.module}`
        if (
          !next.options.permissionPrefix ||
          next.options.permissionPrefix === previousDefault
        ) {
          next.options = {
            ...next.options,
            permissionPrefix: `system:${patch.module}`,
          }
        }
      }
      return next
    })
    setDirty(true)
  }, [])

  const setColumns = useCallback((columns: TableDefinition['columns']) => {
    setDraft((previous) => (previous ? { ...previous, columns } : previous))
    setDirty(true)
  }, [])

  const setDetailTables = useCallback(
    (detailTables: DetailTableDefinition[]) => {
      setDraft((previous) =>
        previous ? { ...previous, detailTables } : previous,
      )
      setDirty(true)
    },
    [],
  )

  const setOptions = useCallback((patch: Partial<GeneratorOptions>) => {
    setDraft((previous) => {
      if (!previous) return previous
      const options = { ...previous.options, ...patch }
      if (patch.audit !== true) return { ...previous, options }
      return {
        ...previous,
        options,
        columns: ensureAuditColumns(previous.columns, true),
        detailTables: previous.detailTables.map((detail) => ({
          ...detail,
          columns: ensureAuditColumns(detail.columns, true, false),
        })),
      }
    })
    setDirty(true)
  }, [])

  const createNew = useCallback(() => {
    if (!confirmDiscard(dirtyRef.current)) return
    setDraft(uniqueDraft(tables))
    setSelectedName(null)
    setDirty(true)
  }, [tables])

  const markSaved = useCallback((saved: TableDefinition) => {
    setDraft(saved)
    setSelectedName(saved.name)
    setDirty(false)
  }, [])

  const clear = useCallback(() => {
    setDraft(null)
    setSelectedName(null)
    setDirty(false)
  }, [])

  return {
    draft,
    selectedName,
    dirty,
    loading,
    load,
    patch,
    setColumns,
    setDetailTables,
    setOptions,
    createNew,
    markSaved,
    clear,
  }
}
