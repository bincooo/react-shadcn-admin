import type { ReactNode } from 'react'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'

/**
 * 通用删除确认弹窗。
 * 只负责确认交互；删除请求、结果提示与关闭时机由调用方决定。
 */
export function DeleteDialog({
  open,
  description,
  pending,
  onConfirm,
  onClose,
  children,
  confirmLabel,
  disableCancelWhilePending = false,
}: {
  open: boolean
  description: ReactNode
  pending: boolean
  onConfirm: () => void
  onClose: () => void
  /** 描述与按钮之间的补充提示，如级联删除影响 */
  children?: ReactNode
  /** 确认按钮文案，默认「删除」 */
  confirmLabel?: ReactNode
  /** 请求进行中时禁止通过 Esc / 点击遮罩关闭，避免请求与弹窗状态脱节 */
  disableCancelWhilePending?: boolean
}) {
  // 取消按钮始终禁用；该开关额外封住 Esc 与遮罩层两条关闭路径
  const closeBlocked = disableCancelWhilePending && pending

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !closeBlocked) onClose()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>删除</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            取消
          </Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {confirmLabel ?? '删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
