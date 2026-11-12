import { toast } from 'sonner'
import { ApiError } from '@/lib/api'

/** 统一的错误提示：优先展示接口返回的字段校验信息。 */
export function notifyError(error: unknown) {
  const message =
    error instanceof Error ? error.message : '操作失败，请查看终端日志'
  const issues = error instanceof ApiError ? error.issues : []
  toast.error(message, {
    description: issues.length > 0 ? issues.slice(0, 4).join('；') : undefined,
  })
}
