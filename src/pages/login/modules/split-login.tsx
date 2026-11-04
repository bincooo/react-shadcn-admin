import { useTranslation } from 'react-i18next'
import { mixPrimary } from '@/lib/color'
import { LoginForm } from './auth-forms'
import {
  BrandMark,
  BrandShade,
  GridOverlay,
  ThirdParty,
} from './login-primitives'
import { useLoginMode } from './use-login-mode'

const SPLIT_BRAND_BG = `linear-gradient(150deg, ${mixPrimary(82, '#050a16')}, ${mixPrimary(45, '#050a16')} 55%, ${mixPrimary(24, '#050a16')})`

const STATS = [
  { value: '60+', label: 'login.statComponents' },
  { value: '6', label: 'login.statLayouts' },
  { value: '100%', label: 'login.statThemed' },
]

/** 臻享双栏：左侧品牌介绍 + 右侧登录表单 */
export function SplitLogin() {
  const { t } = useTranslation()
  const { modeState, registering, setMode } = useLoginMode()

  return (
    <div className="flex min-h-dvh bg-background">
      <aside
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden lg:flex"
        style={{ background: SPLIT_BRAND_BG }}
      >
        <GridOverlay className="bg-size-[36px_36px] opacity-[0.1]" />
        <BrandShade />
        <div className="absolute -top-24 -left-16 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-80 translate-x-1/3 translate-y-1/3 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2.5 p-10">
          <BrandMark className="size-9 rounded-xl bg-white/15 text-white backdrop-blur" />
          <span className="text-[17px] font-semibold tracking-tight text-white">
            {t('app.name')}
          </span>
        </div>

        <div className="relative z-10 px-10">
          <h2 className="max-w-90 text-[30px] leading-tight font-semibold text-white">
            {t('login.brandTitle')}
          </h2>
          <p className="mt-4 max-w-[320px] text-[13px] leading-relaxed text-white/70">
            {t('login.brandDesc')}
          </p>
          <div className="mt-10 grid max-w-75 grid-cols-3 gap-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/15 bg-white/5 p-3"
              >
                <p className="text-[17px] font-semibold text-white">
                  {stat.value}
                </p>
                <p className="text-[11px] text-white/60">{t(stat.label)}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 px-10 pb-8 text-[11.5px] text-white/45">
          {t('login.copyright', { year: new Date().getFullYear() })}
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-90">
          <div className="mb-8 lg:hidden">
            <BrandMark className="size-10 rounded-xl bg-primary text-primary-foreground" />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight">
            {t(registering ? 'login.registerTitle' : 'login.title')}
          </h1>
          <p className="mt-1.5 mb-7 text-[13px] text-muted-foreground">
            {t(registering ? 'login.registerSubtitle' : 'login.subtitle')}
          </p>
          <LoginForm
            idPrefix="split"
            hint
            modeState={modeState}
            onModeChange={setMode}
            submit={{
              className: 'h-10',
            }}
          />
          {!registering && <ThirdParty className="mt-6" />}
        </div>
      </main>
    </div>
  )
}
