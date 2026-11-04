/** 菜单 API 返回的导航节点结构。 */
export interface MenuApiNode {
  key: string
  path: string
  label: string
  icon: string
  children?: MenuApiNode[]
}

export interface MenuNode {
  key: string
  path: string
  label: string
  /** 图标名（PascalCase 或 kebab 均可），渲染交给 `Icon` */
  icon: string
  children?: MenuNode[]
}

const menuTreeCache = new WeakMap<MenuApiNode[], MenuNode[]>()

function mapMenuNode(source: MenuApiNode): MenuNode {
  return {
    key: source.key,
    path: source.path,
    label: source.label,
    icon: source.icon,
    children: source.children?.map(mapMenuNode),
  }
}

/** 菜单接口数据仅映射为侧边导航节点，并按响应数组引用缓存。 */
export function mapMenuTree(source: MenuApiNode[]): MenuNode[] {
  const cached = menuTreeCache.get(source)
  if (cached) return cached

  const tree = source.map(mapMenuNode)
  menuTreeCache.set(source, tree)
  return tree
}

/** 判断当前路径是否属于该导航分组，用于侧边栏激活态。 */
export function containsMenuPath(node: MenuNode, path: string): boolean {
  if (node.path === path) return true
  return node.children?.some((child) => containsMenuPath(child, path)) ?? false
}
