import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { registerRequest } from '@/api/auth'
import { ApiError } from '@/lib/http'
import { useAuthStore } from '@/store/auth'

/**
 * 登录提交流程（表单状态 + 调接口 + 提示 + 跳转）。
 * LoginForm 与 6 种登录风格页面共用，各风格只保留自己的外观。
 */
export function useLoginSubmit() {
  const navigate = useNavigate()
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
      toast.error(err instanceof Error ? err.message : 'Login failed')
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
export function useRegisterSubmit(onSuccess?: () => void) {
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
