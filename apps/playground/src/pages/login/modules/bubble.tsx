import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { mixPrimary } from '@/lib/color'
import { LoginForm, useLoginMode } from './forms'
import { BrandMark } from './primitives'

const BUBBLE_BG = `radial-gradient(circle at 32% 28%, ${mixPrimary(22, 'white')}, ${mixPrimary(8, 'transparent')})`

const BUBBLES = [
  { size: 120, x: '8%', y: '12%', delay: 0 },
  { size: 72, x: '18%', y: '68%', delay: 1.2 },
  { size: 44, x: '76%', y: '22%', delay: 0.6 },
  { size: 96, x: '82%', y: '70%', delay: 1.8 },
  { size: 28, x: '62%', y: '10%', delay: 0.9 },
  { size: 56, x: '34%', y: '86%', delay: 2.1 },
]

/** 气泡简约：漂浮气泡背景 + 居中卡片 */
export function BubbleLogin() {
  const { t } = useTranslation()
  const { modeState, registering, setMode } = useLoginMode()

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-[color-mix(in_oklab,var(--primary)_7%,var(--background))] px-5 py-10">
      {BUBBLES.map((bubble, i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -18, 0], opacity: [0.35, 0.55, 0.35] }}
          transition={{
            duration: 9 + i,
            repeat: Infinity,
            delay: bubble.delay,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: bubble.x,
            top: bubble.y,
            background: BUBBLE_BG,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative isolate w-full max-w-105 overflow-hidden rounded-[30px] border border-white/80 bg-card/90 p-8 shadow-[0_30px_100px_-42px_rgba(44,62,110,0.34)] ring-1 ring-slate-900/4 backdrop-blur-2xl sm:p-10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent"
        />
        <div className="relative z-10 mb-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <BrandMark
              className="size-12 shrink-0 rounded-[18px] bg-linear-to-br from-primary to-primary/75 text-primary-foreground shadow-lg shadow-primary/20"
              iconClassName="size-5"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/6 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-primary uppercase">
              <ShieldCheck className="size-3.5" />
              {t(registering ? 'login.registerEyebrow' : 'login.signInEyebrow')}
            </span>
          </div>
          <h1 className="text-[25px] leading-tight font-semibold tracking-tight">
            {t(registering ? 'login.registerTitle' : 'login.title')}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {t(registering ? 'login.registerSubtitle' : 'login.subtitle')}
          </p>
        </div>
        <div className="relative z-10">
          <LoginForm
            idPrefix="bubble"
            modeState={modeState}
            onModeChange={setMode}
            field={{
              className: 'gap-2.5',
              labelClassName: 'text-[12px] font-semibold text-foreground/80',
              inputClassName:
                'h-12 rounded-2xl border-border/65 bg-muted/30 pr-10 pl-10 text-[13px] shadow-sm shadow-slate-900/[0.02] placeholder:text-muted-foreground/55 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/10',
              iconClassName: 'size-4 text-primary/75',
            }}
            submit={{
              icon: <ArrowRight className="size-4" data-icon="inline-end" />,
              className:
                'mt-1 h-12 w-full rounded-2xl font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25',
            }}
            rememberClassName="text-[12px]"
            forgotClassName="text-[12px] font-semibold"
            hint
          />
        </div>
      </motion.div>
    </div>
  )
}
