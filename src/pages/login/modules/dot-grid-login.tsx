import { useTranslation } from 'react-i18next'
import { Terminal } from 'lucide-react'
import { LoginForm } from './auth-forms'
import { useLoginMode } from './use-login-mode'

/** 终端风格的表单排版：等宽字体 + 紧凑高度 */
const MONO_LABEL =
  'font-mono text-[11px] tracking-wide text-muted-foreground uppercase'
const MONO_FIELD =
  'h-9 rounded-lg border-border bg-background font-mono text-[12.5px]'

/** 经典点阵：点阵遮罩背景 + 终端窗口样式的登录卡 */
export function DotGridLogin() {
  const { t } = useTranslation()
  const { modeState, registering, setMode } = useLoginMode()

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-5 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 62%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, color-mix(in oklab, var(--primary) 36%, var(--foreground) 64%) 1px, transparent 1.6px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle, color-mix(in oklab, var(--primary) 48%, transparent) 1.5px, transparent 2.3px)',
          backgroundSize: '110px 110px',
          backgroundPosition: '11px 11px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/55 to-transparent" />

      <div className="relative w-full max-w-105">
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-primary" />
            <span className="font-mono text-[11.5px] tracking-wider text-muted-foreground uppercase">
              {t('app.name')} / auth
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            online
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card/80 shadow-[0_20px_60px_-32px_rgba(16,24,40,0.4)] backdrop-blur">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
            <span className="size-2 rounded-full bg-danger/70" />
            <span className="size-2 rounded-full bg-warning/70" />
            <span className="size-2 rounded-full bg-success/70" />
            <span className="ml-2 font-mono text-[10.5px] text-muted-foreground">
              ~/login — zsh
            </span>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <p className="font-mono text-[11.5px] text-muted-foreground">
              <span className="text-primary">❯</span>{' '}
              {registering ? 'create --account' : 'authenticate --user'}
            </p>
            <LoginForm
              idPrefix="dot"
              modeState={modeState}
              onModeChange={setMode}
              field={{
                className: 'gap-1.5',
                labelClassName: MONO_LABEL,
                inputClassName: MONO_FIELD,
              }}
              submit={{
                className: 'h-9 w-full font-mono text-[12.5px] tracking-wide',
                icon: <Terminal data-icon="inline-start" />,
                label: '$ sign-in --now',
              }}
              rememberClassName="text-[11.5px]"
              forgotClassName="font-mono"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-[10.5px] text-muted-foreground">
            <span>{t('login.terminalDemo')}</span>
            <span className="text-primary">{t('login.terminalHint')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
