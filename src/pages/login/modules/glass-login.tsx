import { useTranslation } from 'react-i18next'
import { Activity, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { mixPrimary } from '@/lib/color'
import { LoginForm } from './auth-forms'
import { BrandMark, GridOverlay, ThirdParty } from './login-primitives'
import { DARK_FIELD_STYLE } from './login-styles'
import { useLoginMode } from './use-login-mode'

const GLASS_BACKGROUND = `radial-gradient(circle at 18% 18%, ${mixPrimary(42)}, transparent 35%), radial-gradient(circle at 82% 78%, ${mixPrimary(24)}, transparent 32%), #07111f`
const GLASS_FIELD =
  'border-white/15 bg-white/5 text-white placeholder:text-white/35 focus-visible:border-white/45 focus-visible:ring-2 focus-visible:ring-white/10'
const PREVIEW_BARS = [38, 54, 45, 72, 58, 82, 66, 94, 70, 86, 62, 100]

/** Wide glass workspace with a shared login form and a decorative data preview. */
export function GlassLogin() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { modeState, registering, setMode } = useLoginMode()

  return (
    <main
      className="relative isolate grid min-h-dvh overflow-hidden px-5 py-8 text-white sm:px-8 lg:px-12"
      style={{ background: GLASS_BACKGROUND }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(45deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[48px_48px]"
      />
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion ? { opacity: 0.5 } : { x: [0, 26, 0], y: [0, -18, 0] }
        }
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-36 left-[12%] size-96 rounded-full bg-white/10 blur-[100px]"
      />
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion ? { opacity: 0.35 } : { x: [0, -24, 0], y: [0, 20, 0] }
        }
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-[8%] -bottom-48 size-120 rounded-full blur-[110px]"
        style={{ backgroundColor: mixPrimary(58, 'white') }}
      />
      <GridOverlay className="pointer-events-none bg-size-[64px_64px] opacity-[0.035]" />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-16">
        <section className="hidden max-w-2xl flex-col justify-center gap-12 lg:flex">
          <div className="flex items-center gap-3">
            <BrandMark className="size-10 rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md" />
            <div>
              <p className="text-sm font-semibold tracking-wide">
                {t('app.name')}
              </p>
              <p className="text-xs text-white/50">{t('app.slogan')}</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
              {t('login.glassEyebrow')}
            </div>
            <h1 className="text-4xl leading-[1.15] font-semibold tracking-tight whitespace-pre-line text-white xl:text-5xl">
              {t('login.glassHeading')}
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/60 xl:text-base">
              {t('login.glassDescription')}
            </p>
          </div>

          <WorkspacePreview />
        </section>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mx-auto w-full max-w-110"
        >
          <div className="login-flow-border rounded-2xl border border-white/15 bg-white/7.5 p-6 shadow-lg shadow-black/20 backdrop-blur-2xl sm:p-8">
            <div className="mb-7 flex items-center gap-2.5 lg:hidden">
              <BrandMark className="size-9 rounded-lg border border-white/20 bg-white/10 text-white" />
              <span className="text-sm font-semibold text-white">
                {t('app.name')}
              </span>
            </div>

            <div className="mb-7">
              <p className="mb-2 text-xs font-medium tracking-wide text-white/50">
                {t('login.glassEyebrow')}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {t(registering ? 'login.registerTitle' : 'login.title')}
              </h2>
              <p className="mt-1.5 text-sm text-white/60">
                {t(registering ? 'login.registerSubtitle' : 'login.subtitle')}
              </p>
            </div>

            <LoginForm
              idPrefix="glass"
              tone="dark"
              modeState={modeState}
              onModeChange={setMode}
              field={{
                ...DARK_FIELD_STYLE,
                inputClassName: GLASS_FIELD,
              }}
              submit={{
                className:
                  'h-10 w-full bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary-hover-fill',
              }}
            />

            {!registering && <ThirdParty tone="dark" className="mt-6" />}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/40">
              <ShieldCheck className="size-3.5" />
              {t('login.glassSecureNote')}
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}

function WorkspacePreview() {
  const { t } = useTranslation()

  return (
    <div
      aria-hidden="true"
      className="relative max-w-xl rounded-2xl border border-white/15 bg-white/5.5 p-5 backdrop-blur-xl"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-white/75">
            <Activity className="size-4" />
          </span>
          <div>
            <p className="text-xs font-medium text-white/85">
              {t('login.glassPreviewTitle')}
            </p>
            <p className="mt-0.5 text-[10px] text-white/45">
              {t('login.glassPreviewSubtitle')}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/65">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          {t('login.glassLive')}
        </span>
      </div>

      <div className="flex h-28 items-end gap-2 border-b border-white/10 pb-2">
        {PREVIEW_BARS.map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-sm bg-linear-to-t from-primary/20 to-primary/80"
            style={{ height: `${height}%`, opacity: 0.45 + (index % 4) * 0.12 }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-white/50">
        <span>{t('login.glassPreviewCaption')}</span>
        <span className="inline-flex items-center gap-1 text-white/75">
          {t('login.glassPreviewLink')}
          <ArrowUpRight className="size-3" />
        </span>
      </div>
    </div>
  )
}
