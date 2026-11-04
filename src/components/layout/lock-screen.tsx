import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'

const IDLE_MS = 10 * 60 * 1000
const IDLE_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

/**
 * 自动锁屏：开启后空闲 10 分钟遮罩整个界面，输入任意密码解锁（演示）。
 * 计时器只在「已开启 + 未锁屏」时存在，用户操作会重置。
 */
export function LockScreen() {
  const { t } = useTranslation()
  const autoLock = useThemeStore((s) => s.autoLock)
  const user = useAuthStore((s) => s.user)
  const [idleLockedState, setIdleLocked] = useState(false)
  const [passwordState, setPassword] = useState('')

  // 关闭自动锁屏时无需重置状态：遮罩层由派生值决定
  const active = autoLock && idleLockedState

  useEffect(() => {
    if (!autoLock || active) return
    let timer = window.setTimeout(() => setIdleLocked(true), IDLE_MS)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIdleLocked(true), IDLE_MS)
    }
    for (const event of IDLE_EVENTS) {
      window.addEventListener(event, reset, { passive: true })
    }
    return () => {
      window.clearTimeout(timer)
      for (const event of IDLE_EVENTS) {
        window.removeEventListener(event, reset)
      }
    }
  }, [autoLock, active])

  const unlock = () => {
    setIdleLocked(false)
    setPassword('')
  }

  if (!active) return null

  return (
    <div className="fixed inset-0 z-100 grid place-items-center bg-background/90 backdrop-blur-xl">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-4 px-6">
        <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-6" />
        </span>
        <div className="text-center">
          <p className="text-[15px] font-semibold">{user?.name ?? 'Admin'}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {t('header.lock')}
          </p>
        </div>
        <Input
          type="password"
          autoFocus
          value={passwordState}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') unlock()
          }}
          placeholder={t('login.passwordPlaceholder')}
          className="h-10 text-center"
        />
        <Button className="w-full" onClick={unlock}>
          <Unlock data-icon="inline-start" />
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  )
}
