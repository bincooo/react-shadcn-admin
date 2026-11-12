import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { mixPrimary } from '@/lib/color'
import { LoginForm, RegisterForm, useLoginMode } from './forms'
import { ModeSwitch } from './primitives'

const SLIDER_LOGIN_BG = `linear-gradient(145deg, ${mixPrimary(92)}, ${mixPrimary(48)})`
const SLIDER_REGISTER_BG = `linear-gradient(145deg, ${mixPrimary(72, '#183e62')}, ${mixPrimary(42, '#17244d')})`
const SLIDER_PAGE_BG = `radial-gradient(ellipse 56% 54% at 13% 16%, ${mixPrimary(20, '#c7d2fe')} 0%, transparent 100%), radial-gradient(ellipse 58% 56% at 88% 82%, ${mixPrimary(18, '#a5f3fc')} 0%, transparent 100%), radial-gradient(ellipse 36% 38% at 82% 12%, ${mixPrimary(12, '#e9d5ff')} 0%, transparent 100%), linear-gradient(135deg, #ffffff 0%, #f7f9ff 52%, #f4f8fb 100%)`

/** 右侧介绍面板：仅文案、底色与点击行为不同 */
function SliderPanel({
  background,
  eyebrow,
  title,
  description,
  cta,
  onClick,
}: {
  background: string
  eyebrow: string
  title: string
  description: string
  cta?: string
  onClick?: () => void
}) {
  return (
    <div
      className="relative isolate flex w-1/2 flex-col justify-center overflow-hidden px-10"
      style={{ background }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-12 size-64 rounded-full border border-white/10" />
        <div className="absolute top-2 -right-4 size-48 rounded-full border border-white/10" />
        <div className="absolute right-[18%] -bottom-20 size-56 rounded-full bg-white/10 blur-3xl" />
        <svg
          viewBox="0 0 420 300"
          aria-hidden="true"
          className="absolute -right-12 bottom-5 w-[92%] opacity-25"
          fill="none"
        >
          <path
            d="M0 248C82 218 102 238 158 190S253 159 302 119 365 83 420 34"
            stroke="white"
            strokeOpacity=".6"
          />
          <path
            d="M0 274C92 241 115 258 174 211S261 181 315 143 370 113 420 75"
            stroke="white"
            strokeOpacity=".25"
          />
          <path
            d="M0 294H420M0 244H420M0 194H420M0 144H420M0 94H420"
            stroke="white"
            strokeOpacity=".12"
          />
        </svg>
        <div className="absolute inset-0 bg-linear-to-b from-white/[0.035] via-transparent to-black/10" />
      </div>
      <div className="relative z-10">
        <p className="text-[11px] font-medium tracking-[0.2em] text-white/55 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-[26px] leading-tight font-semibold whitespace-pre-line text-white">
          {title}
        </h2>
        <p className="mt-4 max-w-60 text-[12.5px] leading-relaxed text-white/65">
          {description}
        </p>
        {cta && onClick && (
          <Button
            variant="outline"
            className="mt-8 w-fit border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={onClick}
          >
            {cta}
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  )
}

/** 滑动风格的注册表单复用统一注册 API 与校验 */
function RegisterPanel({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  return (
    <RegisterForm
      idPrefix="slider-register"
      submitClassName="h-10 w-full"
      showLoginLink
      onSwitchToLogin={onSwitchToLogin}
      onSuccess={onSwitchToLogin}
    />
  )
}

/** 滑动登录：登录 / 注册两块面板左右滑动切换 */
export function SliderLogin() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { registrationEnabled, modeState: activeMode, setMode } = useLoginMode()

  return (
    <div
      className="relative isolate grid min-h-dvh place-items-center overflow-hidden px-5 py-10"
      style={{ background: SLIDER_PAGE_BG }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(100,116,139,0.18)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_8%,transparent_76%)] bg-size-[30px_30px] opacity-55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(92vw,960px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-400/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(72vw,740px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-400/12"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full opacity-50"
        fill="none"
      >
        <path
          d="M-80 720C170 540 310 820 560 650S930 330 1510 480"
          stroke="#64748b"
          strokeOpacity=".2"
        />
        <path
          d="M-80 760C170 580 310 860 560 690S930 370 1510 520"
          stroke="#64748b"
          strokeOpacity=".12"
        />
        <path
          d="M0 180C250 40 390 260 630 140S1080 35 1460 150"
          stroke="#64748b"
          strokeOpacity=".1"
        />
      </svg>
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion ? { opacity: 0.5 } : { x: [0, 22, 0], y: [0, -16, 0] }
        }
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : { duration: 17, repeat: Infinity, ease: 'easeInOut' }
        }
        className="pointer-events-none absolute -top-32 right-[12%] size-112 rounded-full opacity-55 blur-[110px]"
        style={{ backgroundColor: mixPrimary(24, '#c4b5fd') }}
      />
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion ? { opacity: 0.35 } : { x: [0, -18, 0], y: [0, 14, 0] }
        }
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : { duration: 21, repeat: Infinity, ease: 'easeInOut' }
        }
        className="pointer-events-none absolute -bottom-40 left-[7%] size-136 rounded-full opacity-50 blur-[120px]"
        style={{ backgroundColor: mixPrimary(26, '#99f6e4') }}
      />
      <div className="relative z-10 w-full max-w-215 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-slate-900/10">
        <div className="grid min-h-125 md:grid-cols-2">
          <div className="relative flex items-center justify-center px-8 py-10">
            <AnimatePresence mode="wait" initial={false}>
              {activeMode === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                  className="w-full max-w-[320px]"
                >
                  <h1 className="text-[21px] font-semibold">
                    {t('login.title')}
                  </h1>
                  <p className="mt-1.5 mb-6 text-[12.5px] text-muted-foreground">
                    {t('login.subtitle')}
                  </p>
                  <LoginForm
                    idPrefix="slider"
                    registrationEnabled={false}
                    submit={{ className: 'h-10', spinner: false }}
                    rememberClassName="text-[12.5px]"
                    forgotClassName="text-[12.5px]"
                    footer={
                      <>
                        {registrationEnabled && (
                          <ModeSwitch
                            label={t('login.toRegister')}
                            onClick={() => setMode('register')}
                            className="mt-5 text-muted-foreground"
                          />
                        )}
                        <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
                          {t('login.demoHint')}
                        </p>
                      </>
                    }
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  className="w-full max-w-[320px]"
                >
                  <h1 className="text-[21px] font-semibold">
                    {t('login.registerTitle')}
                  </h1>
                  <p className="mt-1.5 mb-6 text-[12.5px] text-muted-foreground">
                    {t('login.registerSubtitle')}
                  </p>
                  <RegisterPanel onSwitchToLogin={() => setMode('login')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative hidden overflow-hidden md:block">
            <motion.div
              animate={{ x: activeMode === 'login' ? '0%' : '-50%' }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              className="absolute inset-0 flex w-[200%]"
            >
              <SliderPanel
                background={SLIDER_LOGIN_BG}
                eyebrow={t('login.signInEyebrow')}
                title={t('login.signInTitle')}
                description={t('login.signInDesc')}
                cta={registrationEnabled ? t('login.createAccount') : undefined}
                onClick={
                  registrationEnabled ? () => setMode('register') : undefined
                }
              />
              <SliderPanel
                background={SLIDER_REGISTER_BG}
                eyebrow={t('login.registerEyebrow')}
                title={t('login.registerHeading')}
                description={t('login.registerDesc')}
                cta={registrationEnabled ? t('login.backToLogin') : undefined}
                onClick={
                  registrationEnabled ? () => setMode('login') : undefined
                }
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
