import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * PERF: local draft state for live search inputs, committed to the table only
 * after `delay` ms of typing inactivity. Without this, every keystroke ran the
 * full filter → sort → pagination pipeline (plus a whole-table re-render).
 *
 * - External value changes (e.g. the "清空筛选" pills) sync back into the draft.
 * - `flush()` commits immediately (Enter / blur) so the UX stays responsive.
 */
export function useDebouncedInput(
  value: string,
  commit: (next: string) => void,
  delay = 500,
) {
  const [draft, setDraft] = useState(value)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const lastCommitted = useRef(value)
  const commitRef = useRef(commit)
  commitRef.current = commit

  // External / programmatic changes win over the local draft.
  useEffect(() => {
    if (value !== lastCommitted.current) {
      lastCommitted.current = value
      setDraft(value)
    }
  }, [value])

  useEffect(() => {
    if (draft === lastCommitted.current) return
    const timer = window.setTimeout(() => {
      if (draft === lastCommitted.current) return
      lastCommitted.current = draft
      commitRef.current(draft)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [draft, delay])

  const flush = useCallback(() => {
    const current = draftRef.current
    if (current !== lastCommitted.current) {
      lastCommitted.current = current
      commitRef.current(current)
    }
  }, [])

  return { draft, setDraft, flush } as const
}
