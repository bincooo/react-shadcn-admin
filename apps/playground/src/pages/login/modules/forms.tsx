import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Lock, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@repo/ui/components/checkbox'
import { registerRequest } from '@/api/auth'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import {
  AuthField,
  ModeSwitch,
  PasswordToggle,
  SubmitButton,
} from './primitives'

export type LoginMode = 'login' | 'register'

/**
 * 登录 / 注册模式状态：注册总开关关闭时对外始终视为 login。
 * `registrationEnabledProp` 允许表单局部覆盖（例如滑动风格由面板控制切换）。
 */
export function useLoginMode(registrationEnabledProp?: boolean) {
  const registrationSetting = useThemeStore(
    (state) => state.registrationEnabled,
  )
  const registrationEnabled = registrationEnabledProp ?? registrationSetting
  const [selectedModeState, setMode] = useState<LoginMode>('login')

  return {
    registrationEnabled,
    registering: registrationEnabled && selectedModeState === 'register',
    modeState: registrationEnabled ? selectedModeState : 'login',
    setMode,
  }
}

/** Shared login and registration forms used across the visual variants. */

/**
 * 登录提交流程（表单状态 + 调接口 + 提示 + 跳转）。
 * LoginForm 与 6 种登录风格页面共用，各风格只保留自己的外观。
 */
function useLoginSubmit() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const login = useAuthStore((s) => s.login)
  // 预填后端种子演示账号（ddd-springboot 初始化数据），让真实登录开箱即用
  const [usernameState, setUsername] = useState('admin')
  const [passwordState, setPassword] = useState('123456')
  const [submittingState, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submittingState) return
    setSubmitting(true)
    try {
      await login(usernameState, passwordState)
      // 成功后直接进入工作台：欢迎文案已在页面标题，不必再弹 toast
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      toast.error(err instanceof Error ? err.message : t('login.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    usernameState,
    setUsername,
    passwordState,
    setPassword,
    submittingState,
    submit,
  }
}

/** Shared account-creation flow for every login design. */
function useRegisterSubmit(onSuccess?: () => void) {
  const { t } = useTranslation()
  const [usernameState, setUsername] = useState('')
  const [emailState, setEmail] = useState('')
  const [passwordState, setPassword] = useState('')
  const [confirmPasswordState, setConfirmPassword] = useState('')
  const [submittingState, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submittingState) return
    if (passwordState !== confirmPasswordState) {
      toast.error(t('login.passwordMismatch'))
      return
    }

    setSubmitting(true)
    try {
      await registerRequest(
        usernameState.trim(),
        emailState.trim(),
        passwordState,
      )
      toast.success(t('login.registerSuccess'))
      onSuccess?.()
    } catch (error) {
      let message = t('login.registrationFailed')
      if (error instanceof ApiError) {
        if (error.status === 409) message = t('login.registrationConflict')
        else if (error.status === 400) message = t('login.registrationInvalid')
      }
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    usernameState,
    setUsername,
    emailState,
    setEmail,
    passwordState,
    setPassword,
    confirmPasswordState,
    setConfirmPassword,
    submittingState,
    submit,
  }
}

interface FieldStyle {
  className?: string
  labelClassName?: string
  inputClassName?: string
  iconClassName?: string
}

interface SubmitStyle {
  className?: string
  icon?: ReactNode
  spinner?: boolean
  label?: ReactNode
}

interface LoginFormProps {
  /** 深色底（玻璃 / 沉浸式）时文字与描边改用白色透明度 */
  tone?: 'light' | 'dark'
  /** 元素 id 前缀，同页多个表单时避免冲突 */
  idPrefix: string
  field?: FieldStyle
  submit?: SubmitStyle
  rememberClassName?: string
  forgotClassName?: string
  /** 是否渲染演示提示 */
  hint?: boolean
  /** 表单下方附加内容（注册链接等） */
  footer?: ReactNode
  /** 覆盖主题设置；例如滑动风格由外层面板控制注册切换 */
  registrationEnabled?: boolean
  modeState?: LoginMode
  onModeChange?: (mode: LoginMode) => void
}

/** 密码字段：标签 + 锁定图标 + 明文切换按钮 */
function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  field,
  tone = 'light',
  minLength,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
  field?: FieldStyle
  tone?: 'light' | 'dark'
  minLength?: number
  required?: boolean
}) {
  const [visibleState, setVisible] = useState(false)
  const dark = tone === 'dark'

  return (
    <AuthField
      id={id}
      label={label}
      icon={Lock}
      className={field?.className}
      labelClassName={field?.labelClassName}
      iconClassName={field?.iconClassName}
      inputClassName={cn('pr-9', field?.inputClassName)}
      type={visibleState ? 'text' : 'password'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      minLength={minLength}
      required={required}
      trailing={
        <PasswordToggle
          show={visibleState}
          onToggle={() => setVisible((visible) => !visible)}
          className={cn(
            'absolute top-1/2 right-3 -translate-y-1/2 transition-colors',
            dark
              ? 'text-white/50 hover:text-white/85'
              : 'text-muted-foreground hover:text-foreground',
          )}
        />
      }
    />
  )
}

/**
 * 账号 + 密码 + 记住我 + 忘记密码 + 提交。
 * 各登录风格的差异通过 className / tone 覆盖，逻辑与结构完全共享。
 */
export function LoginForm({
  tone = 'light',
  idPrefix,
  field,
  submit,
  rememberClassName,
  forgotClassName,
  hint = false,
  footer,
  registrationEnabled: registrationEnabledProp,
  modeState: modeStateProp,
  onModeChange,
}: LoginFormProps) {
  const { t } = useTranslation()
  const localMode = useLoginMode(registrationEnabledProp)
  const registrationEnabled = localMode.registrationEnabled
  const modeState = modeStateProp ?? localMode.modeState
  const activeMode = registrationEnabled ? modeState : 'login'
  const setMode = (mode: LoginMode) => {
    if (mode === 'register' && !registrationEnabled) return
    if (modeStateProp === undefined) localMode.setMode(mode)
    onModeChange?.(mode)
  }
  const {
    usernameState,
    setUsername,
    passwordState,
    setPassword,
    submittingState,
    submit: onSubmit,
  } = useLoginSubmit()
  const [rememberState, setRemember] = useState(true)
  const rememberId = useId()
  const dark = tone === 'dark'

  if (activeMode === 'register') {
    return (
      <RegisterForm
        idPrefix={`${idPrefix}-register`}
        field={field}
        submitClassName={submit?.className}
        showLoginLink
        onSwitchToLogin={() => setMode('login')}
        onSuccess={() => setMode('login')}
      />
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
    >
      <AuthField
        id={`${idPrefix}-username`}
        label={t('login.username')}
        icon={User}
        className={field?.className}
        labelClassName={field?.labelClassName}
        inputClassName={field?.inputClassName}
        iconClassName={field?.iconClassName}
        value={usernameState}
        onChange={(e) => setUsername(e.target.value)}
        placeholder={t('login.usernamePlaceholder')}
        autoComplete="username"
      />

      <PasswordField
        id={`${idPrefix}-password`}
        label={t('login.password')}
        value={passwordState}
        onChange={setPassword}
        placeholder={t('login.passwordPlaceholder')}
        autoComplete="current-password"
        field={field}
        tone={tone}
      />

      <div className="flex items-center justify-between">
        <label
          htmlFor={rememberId}
          className={cn(
            'flex cursor-pointer items-center gap-2 text-[13px]',
            dark ? 'text-white/65' : 'text-muted-foreground',
            rememberClassName,
          )}
        >
          <Checkbox
            id={rememberId}
            checked={rememberState}
            onCheckedChange={(v) => setRemember(v === true)}
          />
          {t('login.remember')}
        </label>
        <button
          type="button"
          onClick={() => toast.info(t('login.forgot'))}
          className={cn(
            'text-[13px] text-primary hover:underline',
            forgotClassName,
          )}
        >
          {t('login.forgot')}
        </button>
      </div>

      <SubmitButton
        loading={submittingState}
        loadingLabel={t('login.submitting')}
        icon={submit?.icon}
        spinner={submit?.spinner}
        className={submit?.className}
      >
        {submit?.label ?? t('login.submit')}
      </SubmitButton>

      {hint && (
        <p
          className={cn(
            'text-center text-[11.5px]',
            dark ? 'text-white/45' : 'text-muted-foreground',
          )}
        >
          {t('login.demoHint')}
        </p>
      )}

      {registrationEnabled && (
        <ModeSwitch
          label={t('login.toRegister')}
          onClick={() => setMode('register')}
          tone={tone}
        />
      )}
      {footer}
    </form>
  )
}

interface RegisterFormProps {
  idPrefix: string
  field?: FieldStyle
  submitClassName?: string
  showLoginLink?: boolean
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

/** Shared registration fields and validation for inline and slider layouts. */
export function RegisterForm({
  idPrefix,
  field,
  submitClassName,
  showLoginLink = false,
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const { t } = useTranslation()
  const {
    usernameState,
    setUsername,
    emailState,
    setEmail,
    passwordState,
    setPassword,
    confirmPasswordState,
    setConfirmPassword,
    submittingState,
    submit,
  } = useRegisterSubmit(onSuccess)

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
    >
      <AuthField
        id={`${idPrefix}-username`}
        label={t('login.username')}
        icon={User}
        className={field?.className}
        labelClassName={field?.labelClassName}
        inputClassName={field?.inputClassName}
        iconClassName={field?.iconClassName}
        value={usernameState}
        onChange={(event) => setUsername(event.target.value)}
        placeholder={t('login.usernamePlaceholder')}
        autoComplete="username"
        minLength={3}
        maxLength={32}
        required
      />
      <AuthField
        id={`${idPrefix}-email`}
        label={t('login.email')}
        icon={Mail}
        className={field?.className}
        labelClassName={field?.labelClassName}
        inputClassName={field?.inputClassName}
        iconClassName={field?.iconClassName}
        type="email"
        value={emailState}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t('login.emailPlaceholder')}
        autoComplete="email"
        required
      />
      <PasswordField
        id={`${idPrefix}-password`}
        label={t('login.password')}
        value={passwordState}
        onChange={setPassword}
        placeholder={t('login.passwordRule')}
        autoComplete="new-password"
        field={field}
        minLength={8}
        required
      />
      <PasswordField
        id={`${idPrefix}-confirm-password`}
        label={t('login.confirmPassword')}
        value={confirmPasswordState}
        onChange={setConfirmPassword}
        placeholder={t('login.confirmPassword')}
        autoComplete="new-password"
        field={field}
        minLength={8}
        required
      />
      <SubmitButton
        loading={submittingState}
        loadingLabel={t('login.registering')}
        className={submitClassName ?? 'h-10 w-full'}
      >
        {t('login.registerTitle')}
      </SubmitButton>
      {showLoginLink && onSwitchToLogin && (
        <ModeSwitch
          label={t('login.toLogin')}
          onClick={onSwitchToLogin}
          className="text-muted-foreground"
        />
      )}
    </form>
  )
}
