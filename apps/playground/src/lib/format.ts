const DATE_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'short',
})
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'short',
  timeStyle: 'medium',
})

function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 后端 ISO-8601 UTC 时间 → 本地日期（如 2026-11-02）；无效时返回空串 */
export function formatDate(iso: string | null | undefined): string {
  const date = parseIso(iso)
  return date ? DATE_FORMATTER.format(date) : ''
}

/** 后端 ISO-8601 UTC 时间 → 本地日期时间；无效时返回破折号 */
export function formatDateTime(iso: string | null | undefined): string {
  const date = parseIso(iso)
  return date ? DATE_TIME_FORMATTER.format(date) : '—'
}

/** 未知错误 → 可展示的提示文案 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
