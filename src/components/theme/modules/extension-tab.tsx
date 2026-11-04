import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  Lock,
  Copyright,
  Contrast,
  Type,
  RotateCcw,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useThemeStore } from '@/store/theme'
import { Section } from '../section'
import { ToggleRow, TextRow } from './rows'
import { PANEL_STACK } from './panel-styles'
/** 扩展页签：水印、灰度、色弱、自动锁屏与页脚版权 */
export function ExtensionTab() {
  const { t } = useTranslation()
  const s = useThemeStore(
    useShallow((st) => ({
      watermark: st.watermark,
      watermarkText: st.watermarkText,
      showFooter: st.showFooter,
      copyright: st.copyright,
      copyrightText: st.copyrightText,
      grayMode: st.grayMode,
      colorWeak: st.colorWeak,
      autoLock: st.autoLock,
      update: st.update,
      resetAll: st.resetAll,
    })),
  )

  return (
    <div className={PANEL_STACK}>
      <Section icon={Sparkles} title={t('extension.visualSection')}>
        <div className="flex flex-col gap-2">
          <ToggleRow
            icon={Sparkles}
            label={t('extension.watermark')}
            description={t('extension.watermarkDesc')}
            checked={s.watermark}
            onCheckedChange={(watermark) => s.update({ watermark })}
          />
          <TextRow
            icon={Type}
            label={t('extension.watermarkText')}
            description={t('extension.watermarkTextDesc')}
            value={s.watermarkText}
            placeholder={t('extension.watermarkPlaceholder')}
            disabled={!s.watermark}
            onChange={(watermarkText) => s.update({ watermarkText })}
          />
          <ToggleRow
            icon={Contrast}
            label={t('extension.grayMode')}
            description={t('extension.grayModeDesc')}
            checked={s.grayMode}
            onCheckedChange={(grayMode) => s.update({ grayMode })}
          />
          <ToggleRow
            icon={Contrast}
            label={t('extension.colorWeak')}
            description={t('extension.colorWeakDesc')}
            checked={s.colorWeak}
            onCheckedChange={(colorWeak) => s.update({ colorWeak })}
          />
        </div>
      </Section>

      <Section icon={Lock} title={t('extension.securitySection')}>
        <div className="flex flex-col gap-2">
          <ToggleRow
            icon={Lock}
            label={t('extension.autoLock')}
            description={t('extension.autoLockDesc')}
            checked={s.autoLock}
            onCheckedChange={(autoLock) => s.update({ autoLock })}
          />
          <ToggleRow
            icon={Copyright}
            label={t('extension.showCopyright')}
            description={t('extension.showCopyrightDesc')}
            checked={s.copyright}
            onCheckedChange={(copyright) => s.update({ copyright })}
          />
          <TextRow
            icon={Copyright}
            label={t('extension.copyrightText')}
            description={t('extension.copyrightTextDesc')}
            value={s.copyrightText}
            placeholder={t('extension.copyrightPlaceholder')}
            disabled={!s.copyright || !s.showFooter}
            onChange={(copyrightText) => s.update({ copyrightText })}
          />
        </div>
      </Section>

      <Separator />

      <Button variant="outline" className="w-full" onClick={() => s.resetAll()}>
        <RotateCcw data-icon="inline-start" />
        {t('theme.resetAll')}
      </Button>
    </div>
  )
}
