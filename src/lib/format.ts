/** 后端 ISO-8601 UTC 时间（如 2026-11-01T15:00:38.123Z）→ 本地时区的可读格式 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

/** 未知错误 → 可展示的提示文案 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
