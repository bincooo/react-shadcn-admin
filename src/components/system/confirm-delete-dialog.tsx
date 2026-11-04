import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * 删除确认弹窗：系统管理各页面共用。
 * 只负责确认交互；删除请求、结果提示与关闭时机由调用方决定。
 */
export function ConfirmDeleteDialog({
  open,
  description,
  pendingState,
  onConfirm,
  onClose,
  children,
  confirmLabel,
  disableCancelWhilePending = false,
}: {
  open: boolean
  description: ReactNode
  pendingState: boolean
  onConfirm: () => void
  onClose: () => void
  /** 描述与按钮之间的补充提示，如级联删除影响 */
  children?: ReactNode
  /** 确认按钮文案，默认「删除」 */
  confirmLabel?: ReactNode
  /** 请求进行中同时禁用取消按钮（等待删除完成后再关闭） */
  disableCancelWhilePending?: boolean
}) {
  const { t } = useTranslation()

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('common.delete')}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={disableCancelWhilePending && pendingState}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            disabled={pendingState}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
