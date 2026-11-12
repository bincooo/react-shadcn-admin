import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { notifyError } from '@/lib/notify'
import type { GenerateResult, TableDefinition } from '@/types'

/**
 * 代码预览：按表 id 懒加载一次，草稿变化后标记为过期（stale）。
 *
 * `attempt` 记录已经自动尝试过的表 id，避免切回预览页时反复请求。
 */
export function usePreview(draft: TableDefinition | null, tab: string) {
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [stale, setStale] = useState(false)
  const attempt = useRef<string | null>(null)

  const reset = useCallback(() => {
    setResult(null)
    setStale(false)
    attempt.current = null
  }, [])

  const markStale = useCallback(() => {
    setStale(true)
  }, [])

  const run = useCallback(async () => {
    if (!draft || loading) return
    setLoading(true)
    try {
      const generated = await api.preview(draft)
      setResult(generated)
      setStale(false)
    } catch (error) {
      notifyError(error)
    } finally {
      setLoading(false)
    }
  }, [draft, loading])

  useEffect(() => {
    if (tab !== 'preview' || !draft) return
    const key = draft.id
    if (result || attempt.current === key) return
    attempt.current = key
    void run()
  }, [tab, draft, result, run])

  return { result, loading, stale, run, reset, markStale }
}
