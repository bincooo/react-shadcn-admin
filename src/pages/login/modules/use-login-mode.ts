import { useState } from 'react'
import { useThemeStore } from '@/store/theme'

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
