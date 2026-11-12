/** 菜单导航节点：侧边栏、面包屑与分组共用同一结构。 */
export interface MenuNode {
  key: string
  path: string
  label: string
  /** 图标名（PascalCase 或 kebab 均可），渲染交给 `Icon` */
  icon: string
  children?: MenuNode[]
}

/** 菜单接口返回的节点与导航节点同构，直接复用，不做逐字段复制。 */
export type MenuApiNode = MenuNode

/** 判断当前路径是否属于该导航分组，用于侧边栏激活态。 */
export function containsMenuPath(node: MenuNode, path: string): boolean {
  if (node.path === path) return true
  return node.children?.some((child) => containsMenuPath(child, path)) ?? false
}
