import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/format'

/**
 * 批量删除：逐个调用删除接口，全部结束后统一提示与清理。
 * 任一失败即抛出汇总错误，由错误提示告知剩余数量。
 */
export function useBatchDeleteMutation<TId>({
  remove,
  entityPluralKey,
  onDeleted,
}: {
  remove: (id: TId) => Promise<unknown>
  /** 提示文案里的对象名（i18n key）；中文与单数同形，英文区分为 users/roles */
  entityPluralKey: string
  /** 删除成功后的页面清理，如清空多选与失效列表缓存 */
  onDeleted: () => void
}) {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (ids: TId[]) => {
      const results = await Promise.allSettled(ids.map((id) => remove(id)))
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed > 0) {
        throw new Error(
          t('system.action.deleteFailed', {
            failed,
            entity: t(entityPluralKey),
          }),
        )
      }
      return ids.length
    },
    onSuccess: (count) => {
      toast.success(
        t('system.action.deleteMany', {
          count,
          entity: t(entityPluralKey),
        }),
      )
      onDeleted()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}
