import { iconNames, type IconName } from 'lucide-react/dynamic'

/** 无法识别（或为空）时统一回退的图标 */
export const FALLBACK_ICON: IconName = 'list'

const ICON_NAME_SET = new Set<string>(iconNames)

/**
 * 把任意写法的图标名规整成 lucide 的下级中横线命名。
 *
 * `LayoutDashboard → layout-dashboard`、`Building2 → building-2`、
 * `AArrowDown → a-arrow-down`。已经是中横线格式的输入原样返回。
 */
export function withIconName(name: string): string {
  return name
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase()
}

/** 名字是否对应 lucide 里真实存在的图标 */
export function isIconName(name: string): boolean {
  return ICON_NAME_SET.has(withIconName(name))
}

/** 解析成 `DynamicIcon` 可用的图标名；无法识别时回退到 `list` */
export function resolveIconName(name: string): IconName {
  const resolved = withIconName(name)
  return ICON_NAME_SET.has(resolved) ? (resolved as IconName) : FALLBACK_ICON
}
