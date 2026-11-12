import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/format'

/**
 * 批量删除：一次请求删除全部目标，成功后统一提示与清理。
 * 后端按单事务执行，任一目标非法时整体失败，由错误提示展示后端 message。
 */
export function useBatchDeleteMutation<TId>({
  removeMany,
  entityLabel,
  onDeleted,
}: {
  removeMany: (ids: TId[]) => Promise<unknown>
  /** 提示文案里的对象名，如「用户」「角色」 */
  entityLabel: string
  /** 删除成功后的页面清理，如清空多选与失效列表缓存 */
  onDeleted: () => void
}) {
  return useMutation({
    mutationFn: async (ids: TId[]) => {
      await removeMany(ids)
      return ids.length
    },
    onSuccess: (count) => {
      toast.success(`已删除 ${count} 个${entityLabel}`)
      onDeleted()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}
