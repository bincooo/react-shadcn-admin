import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { Button } from '@repo/ui/components/button'
import { destroyCachedPage } from '@/lib/keepalive'
import { useAppStore } from '@/store/app'

export default function NotFound() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const closeCurrTab = useAppStore((state) => state.closeCurrTab)

  /** 返回首页前关闭当前 404 页签（含 keep-alive 缓存） */
  const closeCurrentTab = () => {
    // 先关页签，再按原始 pathname 清缓存（keep-alive 的 key 是原始路径）
    closeCurrTab()
    destroyCachedPage(pathname)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="bg-linear-to-b from-foreground to-foreground/40 bg-clip-text text-[76px] leading-none font-bold text-transparent">
        404
      </p>
      <p className="text-sm text-muted-foreground">{t('page.notFound')}</p>
      <Button
        render={<Link to="/dashboard" />}
        nativeButton={false}
        className="mt-2"
        onClick={closeCurrentTab}
      >
        {t('common.backHome')}
      </Button>
    </div>
  )
}
