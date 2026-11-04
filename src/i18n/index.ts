import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

export const LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
] as const

type Language = (typeof LANGUAGES)[number]['value']

const stored = localStorage.getItem('react-admin-lang') as Language | null

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: stored ?? 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
})

export function changeLanguage(lang: Language) {
  localStorage.setItem('react-admin-lang', lang)
  return i18n.changeLanguage(lang)
}

export default i18n
