import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

export const LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
] as const

type Language = (typeof LANGUAGES)[number]['value']

const LANGUAGE_STORAGE_KEY = 'react-admin-lang'

function isLanguage(value: string | null): value is Language {
  return LANGUAGES.some((language) => language.value === value)
}

/** localStorage 可能被隐私模式或浏览器策略禁用，读取失败时回退默认语言 */
function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(stored) ? stored : 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
})

/** 让屏幕阅读器与拼写检查跟随当前语言 */
function syncDocumentLanguage(language: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}

syncDocumentLanguage(i18n.language)
i18n.on('languageChanged', syncDocumentLanguage)

export function changeLanguage(lang: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  } catch {
    // 存储不可用时仍允许本次会话切换语言
  }
  return i18n.changeLanguage(lang)
}

export default i18n
