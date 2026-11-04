import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
/** 页脚：显示条件由主题配置的 showFooter/copyright 决定，自定义文案优先 */
export function Footer() {
  const { t } = useTranslation()
  const showFooter = useThemeStore((s) => s.showFooter)
  const copyright = useThemeStore((s) => s.copyright)
  const copyrightText = useThemeStore((s) => s.copyrightText)

  if (!showFooter || !copyright) return null

  // 自定义文案优先；留空时用默认版权模板 + 版本号
  const custom = copyrightText.trim()
  const text =
    custom ||
    `${t('login.copyright', { year: new Date().getFullYear() })} · ${t('app.version')}`

  return (
    <footer className="shrink-0 border-t px-6 py-3 text-center text-[12px] text-muted-foreground">
      {text}
    </footer>
  )
}
