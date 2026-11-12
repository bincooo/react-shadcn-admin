import { useTranslation } from 'react-i18next'
import { enLocale, zhLocale, type TableLocale } from '@repo/table'

/**
 * 表格内置文案跟随应用语言。
 *
 * `@repo/table` 不依赖 i18n 框架，这里在应用层把语言映射到组件库
 * 自带的两份文案，再通过 `TableLocaleProvider` 下发。
 */
export function useAppTableLocale(): TableLocale {
  const { i18n } = useTranslation()
  return i18n.language.startsWith('zh') ? zhLocale : enLocale
}
