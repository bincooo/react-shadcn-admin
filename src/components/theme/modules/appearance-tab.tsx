import { useTranslation } from 'react-i18next'
import {
  Palette,
  SwatchBook,
  CircleCheckBig,
  LayoutTemplate,
  LogIn,
  Contrast,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { contrastRatio } from '@/lib/color'
import { useThemeStore } from '@/store/theme'
import {
  LAYOUT_OPTIONS,
  LOGIN_STYLE_OPTIONS,
  MODE_OPTIONS,
  STATUS_COLORS,
} from '@/config/theme'
import { Section } from '../section'
import { COLOR_SWATCH_CARD, PANEL_STACK, SEGMENTED } from './panel-styles'
import { ColorSwatches, CustomColorField } from '../color-controls'
import { LayoutPreview, LoginPreview, PreviewTile } from '../previews'
import { StatusColorRow } from './status-color-row'
import { ToggleRow } from './rows'
/** 外观页签：明暗模式、主色与状态色；改动即时写入 CSS 变量 */
export function AppearanceTab() {
  const { t } = useTranslation()
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const primaryColor = useThemeStore((s) => s.primaryColor)
  const setPrimaryColor = useThemeStore((s) => s.setPrimaryColor)
  const layoutStyle = useThemeStore((s) => s.layoutStyle)
  const setLayoutStyle = useThemeStore((s) => s.setLayoutStyle)
  const loginStyle = useThemeStore((s) => s.loginStyle)
  const setLoginStyle = useThemeStore((s) => s.setLoginStyle)
  const registrationEnabled = useThemeStore((s) => s.registrationEnabled)
  const setRegistrationEnabled = useThemeStore((s) => s.setRegistrationEnabled)

  const contrast = contrastRatio(primaryColor, '#FFFFFF')

  return (
    <div className={PANEL_STACK}>
      <Section icon={Palette} title={t('theme.themeMode')}>
        <div className={`${SEGMENTED} grid-cols-3`}>
          {MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = mode === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={active}
                className={cn(
                  'flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium transition-colors outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring/50',
                  active
                    ? 'bg-card text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" />
                {t(label)}
              </button>
            )
          })}
        </div>
      </Section>

      <Section
        icon={SwatchBook}
        title={t('theme.themeColor')}
        action={
          <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <Contrast className="size-3" />
            {t('theme.contrast')} {contrast.toFixed(2)}
          </span>
        }
      >
        <div className="flex flex-col gap-2.5">
          <div className={COLOR_SWATCH_CARD}>
            <ColorSwatches value={primaryColor} onChange={setPrimaryColor} />
          </div>
          <CustomColorField value={primaryColor} onChange={setPrimaryColor} />
        </div>
      </Section>

      <Section icon={CircleCheckBig} title={t('theme.statusColors')}>
        <div className="flex flex-col gap-2">
          {STATUS_COLORS.map(({ key, label }) => (
            <StatusColorRow key={key} statusKey={key} label={t(label)} />
          ))}
        </div>
      </Section>

      <Section icon={LayoutTemplate} title={t('theme.layoutStyle')}>
        <div className="grid grid-cols-2 gap-2.5">
          {LAYOUT_OPTIONS.map((option) => (
            <PreviewTile
              key={option.value}
              selected={layoutStyle === option.value}
              label={t(option.label)}
              onClick={() => setLayoutStyle(option.value)}
            >
              <LayoutPreview layout={option.value} />
            </PreviewTile>
          ))}
        </div>
      </Section>

      <Section icon={LogIn} title={t('theme.loginStyle')}>
        <div className="grid grid-cols-2 gap-2.5">
          {LOGIN_STYLE_OPTIONS.map((option) => (
            <PreviewTile
              key={option.value}
              selected={loginStyle === option.value}
              label={t(option.label)}
              description={t(option.descriptionKey)}
              onClick={() => setLoginStyle(option.value)}
            >
              <LoginPreview variant={option.value} />
            </PreviewTile>
          ))}
        </div>
      </Section>

      <Section icon={UserPlus} title={t('theme.registration')}>
        <ToggleRow
          icon={UserPlus}
          label={t('theme.registration')}
          description={t('theme.registrationDesc')}
          checked={registrationEnabled}
          onCheckedChange={setRegistrationEnabled}
        />
      </Section>
    </div>
  )
}
