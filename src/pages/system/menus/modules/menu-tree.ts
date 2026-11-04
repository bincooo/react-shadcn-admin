import type { SystemMenu } from '@/api/system/menu'

/**
 * 菜单树的纯函数工具：树遍历、筛选与节点查找。
 *
 * 全部是纯函数，不含 React 状态，因此与 `use-menus-sync` 的查询/变更逻辑分开，
 * 便于单独测试与复用。菜单管理页的树是全量数据，筛选在客户端完成。
 */

/** 菜单类型 → i18n 词条 key */
export const MENU_TYPE_LABEL_KEYS: Record<SystemMenu['menuType'], string> = {
  DIRECTORY: 'system.menu.type.directory',
  MENU: 'system.menu.type.menu',
  BUTTON: 'system.menu.type.button',
}

/** 收集节点自身及其全部后代编码；父级下拉据此排除，避免挂到自身子树形成环 */
export function collectSelfAndDescendants(
  node: SystemMenu,
  acc: Set<string>,
): Set<string> {
  acc.add(node.menuCode)
  for (const child of node.children ?? []) {
    collectSelfAndDescendants(child, acc)
  }
  return acc
}

/** 统计剥掉按钮后的树节点数（左栏卡片头部「N 个节点」口径） */
export function countBranchNodes(nodes: SystemMenu[]): number {
  return nodes.reduce(
    (sum, node) =>
      node.menuType === 'BUTTON'
        ? sum
        : sum + 1 + countBranchNodes(node.children ?? []),
    0,
  )
}

/**
 * 构造子树保留谓词：命中关键字（展示名/原始名称/编码，忽略大小写）的节点保留，
 * 未命中但有命中后代的节点作为路径保留，避免命中节点在树上悬空。
 */
export function toTreePredicate(
  keyword: string,
  translateName: (name: string) => string,
) {
  const lowerKeyword = keyword.trim().toLowerCase()
  const matches = (node: SystemMenu): boolean =>
    node.menuName.toLowerCase().includes(lowerKeyword) ||
    translateName(node.menuName).toLowerCase().includes(lowerKeyword) ||
    node.menuCode.toLowerCase().includes(lowerKeyword)
  const keep = (node: SystemMenu): boolean =>
    matches(node) || (node.children ?? []).some(keep)
  return keep
}

/** 递归过滤树：命中节点与通往命中节点的路径保留，其余剪掉 */
export function filterMenuTree(
  nodes: SystemMenu[],
  keep: (node: SystemMenu) => boolean,
): SystemMenu[] {
  const result: SystemMenu[] = []
  for (const node of nodes) {
    const children = filterMenuTree(node.children ?? [], keep)
    if (keep(node)) {
      result.push({ ...node, children })
    }
  }
  return result
}

/** 按编码在树中查找节点；找不到（如已被删除）返回 null */
export function findMenuNode(
  nodes: SystemMenu[],
  menuCode: string,
): SystemMenu | null {
  for (const node of nodes) {
    if (node.menuCode === menuCode) return node
    const hit = findMenuNode(node.children ?? [], menuCode)
    if (hit) return hit
  }
  return null
}
