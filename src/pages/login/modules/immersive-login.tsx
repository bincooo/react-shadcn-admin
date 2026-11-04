import { useTranslation } from 'react-i18next'
import { mixPrimary } from '@/lib/color'
import { LoginForm } from './auth-forms'
import { BrandMark, BrandShade, GridOverlay } from './login-primitives'
import { DARK_FIELD_STYLE } from './login-styles'
import { useLoginMode } from './use-login-mode'

const IMMERSIVE_BG = `radial-gradient(1200px 600px at 20% 10%, ${mixPrimary(55, 'transparent')}, transparent 65%), radial-gradient(900px 500px at 90% 90%, ${mixPrimary(35, 'transparent')}, transparent 60%)`

/** 深色卡片上的输入框 */
const DARK_FIELD =
  'border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/45 focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]'

/** 分屏沉浸：左侧品牌叙事 + 右侧深色玻璃卡表单 */
export function ImmersiveLogin() {
  const { t } = useTranslation()
  const { modeState, registering, setMode } = useLoginMode()

  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-[#080b14]">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ background: IMMERSIVE_BG }}
        />
        <GridOverlay className="bg-size-[56px_56px] opacity-[0.08]" />
        <BrandShade />
      </div>

      <div className="relative z-10 hidden flex-1 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-9 rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur" />
          <span className="text-[17px] font-semibold text-white">
            {t('app.name')}
          </span>
        </div>

        <div>
          <p className="text-[11px] font-medium tracking-[0.28em] text-white/40 uppercase">
            {t('login.immersiveEyebrow')}
          </p>
          <h2 className="mt-4 max-w-115 text-[38px] leading-[1.15] font-semibold tracking-tight whitespace-pre-line text-white">
            {t('login.immersiveTitle')}
          </h2>
          <p className="mt-5 max-w-95 text-[13px] leading-relaxed text-white/55">
            {t('login.immersiveDesc')}
          </p>
        </div>

        <div className="flex items-center gap-6 text-[11.5px] text-white/40">
          <span>
            {t('login.copyright', { year: new Date().getFullYear() })}
          </span>
          <span>{t('login.privacy')}</span>
          <span>{t('login.terms')}</span>
        </div>
      </div>

      <div className="relative z-10 flex w-full items-center justify-center px-5 py-10 lg:w-[52%]">
        <div className="login-flow-border dark w-full max-w-95 rounded-3xl border border-white/12 bg-white/4 p-8 text-foreground shadow-[0_32px_80px_-32px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="mb-7 lg:hidden">
            <BrandMark className="size-9 rounded-xl bg-white/10 text-white" />
          </div>
          <h1 className="text-[22px] font-semibold text-white">
            {t(registering ? 'login.registerTitle' : 'login.title')}
          </h1>
          <p className="mt-1.5 mb-7 text-[12.5px] text-white/50">
            {t(registering ? 'login.registerSubtitle' : 'login.subtitle')}
          </p>

          <LoginForm
            idPrefix="immersive"
            tone="dark"
            modeState={modeState}
            onModeChange={setMode}
            field={{
              ...DARK_FIELD_STYLE,
              inputClassName: DARK_FIELD,
            }}
            submit={{ className: 'h-10 w-full' }}
            hint
          />
        </div>
      </div>
    </div>
  )
}
