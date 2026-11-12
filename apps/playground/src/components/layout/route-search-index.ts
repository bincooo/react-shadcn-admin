import type { RouteEntry } from '@/router/types'

/**
 * 页面搜索的索引项：展示文案、分组，以及三种可匹配形式。
 *
 * 与 React 状态无关，索引构建与匹配放在这里，`use-route-search-sync`
 * 只负责输入状态与键盘交互。
 */
export interface RouteSearchEntry {
  route: RouteEntry
  /** 面包屑去掉末级后的分组路径 */
  group: string
  label: string
  /** 归一化后的命中串：名称 + 分组 + 词条 key */
  haystack: string
  /** 中文全拼（无声调） */
  fullPinyin: string
  /** 中文首字母 */
  initials: string
}

/** 拼音转换函数签名，由调用方按需加载后注入 */
type PinyinConverter = (
  text: string,
  options: { pattern?: 'first'; toneType?: 'none'; type: 'array' },
) => string[]

/** 构建一条索引项；拼音库未就绪时留空，不影响按文字匹配 */
export function buildRouteSearchEntry({
  route,
  label,
  group,
  pinyin,
}: {
  route: RouteEntry
  label: string
  group: string
  pinyin: PinyinConverter | null
}): RouteSearchEntry {
  return {
    route,
    group,
    label,
    haystack: [label, group, route.title].join(' ').toLowerCase(),
    fullPinyin: pinyin
      ? pinyin(label, { toneType: 'none', type: 'array' }).join('')
      : '',
    initials: pinyin
      ? pinyin(label, {
          pattern: 'first',
          toneType: 'none',
          type: 'array',
        }).join('')
      : '',
  }
}

/** 关键字匹配：任一形式的命中即可，空关键字视为全部命中 */
export function matchesRouteSearch(
  entry: RouteSearchEntry,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    entry.haystack.includes(normalized) ||
    entry.fullPinyin.includes(normalized) ||
    entry.initials.includes(normalized)
  )
}
