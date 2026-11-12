import { filterTreeWithAncestors } from '@repo/tree'
import type { Menu } from '@/api/system/menu'

/**
 * 菜单树的纯函数工具：树遍历、筛选与节点查找。
 *
 * 全部是纯函数，不含 React 状态，因此与 `use-menu` 的查询/变更逻辑分开，
 * 便于单独测试与复用。菜单管理页的树是全量数据，筛选在客户端完成。
 */

/** 菜单类型 → 中文标签 */
export const MENU_TYPE_LABELS: Record<Menu['menuType'], string> = {
  DIRECTORY: '目录',
  MENU: '菜单',
  BUTTON: '按钮',
}

/** 后端预置菜单的名称（菜单名存的是词条 key）；自定义中文名称原样展示 */
const MENU_NAME_LABELS: Record<string, string> = {
  'menu.dashboard': '仪表盘',
  'menu.workspace': '工作台',
  'menu.components': '组件演示',
  'menu.profile': '个人中心',
  'menu.system': '系统管理',
  'menu.user': '用户管理',
  'menu.menus': '菜单管理',
  'menu.role': '角色管理',
  'menu.dept': '部门管理',
  'menu.userQuery': '查询用户',
  'menu.userCreate': '新增用户',
  'menu.userUpdate': '编辑用户',
  'menu.userDelete': '删除用户',
  'menu.userResetPassword': '重置密码',
  'menu.menuQuery': '查询菜单',
  'menu.menuCreate': '新增菜单',
  'menu.menuUpdate': '编辑菜单',
  'menu.menuDelete': '删除菜单',
  'menu.roleQuery': '查询角色',
  'menu.roleCreate': '新增角色',
  'menu.roleUpdate': '编辑角色',
  'menu.roleDelete': '删除角色',
  'menu.roleAssignUser': '分配用户',
  'menu.deptQuery': '查询部门',
  'menu.deptCreate': '新增部门',
  'menu.deptUpdate': '编辑部门',
  'menu.deptDelete': '删除部门',
}

/** 菜单名称统一按中文展示；已是中文的自定义名称原样返回 */
export function menuNameLabel(name: string): string {
  return MENU_NAME_LABELS[name] ?? name
}

/** 收集节点自身及其全部后代 id；父级下拉据此排除，避免挂到自身子树形成环 */
export function collectSelfAndDescendantIds(
  node: Menu,
  acc: Set<string>,
): Set<string> {
  acc.add(node.id)
  for (const child of node.children ?? []) {
    collectSelfAndDescendantIds(child, acc)
  }
  return acc
}

/** 统计剥掉按钮后的树节点数（左栏卡片头部「N 个节点」口径） */
export function countBranchNodes(nodes: Menu[]): number {
  return nodes.reduce(
    (sum, node) =>
      node.menuType === 'BUTTON'
        ? sum
        : sum + 1 + countBranchNodes(node.children ?? []),
    0,
  )
}

/** 按名称筛选目录与页面（按钮不参与匹配），保留命中节点的上级路径。 */
export function filterMenuTree(nodes: Menu[], keyword: string): Menu[] {
  const lowerKeyword = keyword.trim().toLowerCase()
  if (!lowerKeyword) return nodes
  return filterTreeWithAncestors(nodes, (node) => {
    if (node.menuType === 'BUTTON') return false
    return (
      node.menuName.toLowerCase().includes(lowerKeyword) ||
      menuNameLabel(node.menuName).toLowerCase().includes(lowerKeyword)
    )
  })
}

/** 按代理 id 在树中查找节点；找不到（如已被删除）返回 null */
export function findMenuNode(nodes: Menu[], menuId: string): Menu | null {
  for (const node of nodes) {
    if (node.id === menuId) return node
    const hit = findMenuNode(node.children ?? [], menuId)
    if (hit) return hit
  }
  return null
}

/** 递归浅拷贝菜单树节点及其 children 数组，用于不可变拖拽重排 */
function cloneMenuTree(nodes: Menu[]): Menu[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? cloneMenuTree(node.children) : [],
  }))
}

interface LocatedMenu {
  node: Menu
  parent: Menu | null
  siblings: Menu[]
}

function locateMenuNode(
  nodes: Menu[],
  menuId: string,
  parent: Menu | null = null,
): LocatedMenu | null {
  for (const node of nodes) {
    if (node.id === menuId) return { node, parent, siblings: nodes }
    const hit = locateMenuNode(node.children ?? [], menuId, node)
    if (hit) return hit
  }
  return null
}

/**
 * 重排受影响分组下非按钮子节点的排序号（1..N），保留 BUTTON 子节点位置与自身 seq 不变。
 */
function reindexBranchSiblings(siblings: Menu[]): void {
  let seq = 1
  for (const sibling of siblings) {
    if (sibling.menuType === 'BUTTON') continue
    sibling.seq = seq++
  }
}

/** 收集菜单树中与原始树相比 parentMenuId 或 seq 发生变化的节点 */
function collectReorderedUpdates(original: Menu[], next: Menu[]): Menu[] {
  const beforeMap = new Map<
    string,
    { parentMenuId: string | undefined; seq: number }
  >()
  const indexOriginal = (nodes: Menu[]) => {
    for (const node of nodes) {
      beforeMap.set(node.id, {
        parentMenuId: node.parentMenuId,
        seq: node.seq,
      })
      if (node.children?.length) indexOriginal(node.children)
    }
  }
  indexOriginal(original)

  const updates: Menu[] = []
  const walkNext = (nodes: Menu[]) => {
    for (const node of nodes) {
      if (node.menuType !== 'BUTTON') {
        const prev = beforeMap.get(node.id)
        if (
          prev &&
          (prev.parentMenuId !== node.parentMenuId || prev.seq !== node.seq)
        ) {
          updates.push(node)
        }
      }
      if (node.children?.length) walkNext(node.children)
    }
  }
  walkNext(next)
  return updates
}

/**
 * 拖拽排序纯函数：将 `dragId` 移动到 `targetId` 的前（-1）/ 内（0）/ 后（1），
 * 仅在目录节点允许作为容器落点（position === 0），并重算受影响层级的 `seq`（1..N）。
 * 若落点无变化或非法（如拖入自身子树/页面节点内部），返回 `null`。
 */
export function reorderMenuTree(
  nodes: Menu[],
  dragId: string,
  targetId: string,
  position: -1 | 0 | 1,
): { nextTree: Menu[]; updates: Menu[] } | null {
  if (dragId === targetId) return null

  const nextTree = cloneMenuTree(nodes)
  const dragLocated = locateMenuNode(nextTree, dragId)
  const targetLocated = locateMenuNode(nextTree, targetId)
  if (!dragLocated || !targetLocated) return null
  if (
    dragLocated.node.menuType === 'BUTTON' ||
    targetLocated.node.menuType === 'BUTTON'
  ) {
    return null
  }
  if (position === 0 && targetLocated.node.menuType !== 'DIRECTORY') {
    return null
  }

  const forbiddenTargets = collectSelfAndDescendantIds(
    dragLocated.node,
    new Set<string>(),
  )
  if (forbiddenTargets.has(targetId)) return null

  const oldParentId = dragLocated.parent?.id ?? undefined
  const oldIndex = dragLocated.siblings.indexOf(dragLocated.node)
  if (oldIndex < 0) return null
  dragLocated.siblings.splice(oldIndex, 1)

  const targetParentId =
    position === 0
      ? targetLocated.node.id
      : (targetLocated.parent?.id ?? undefined)
  let targetSiblings: Menu[]
  if (position === 0) {
    targetLocated.node.children ??= []
    targetSiblings = targetLocated.node.children
  } else {
    targetSiblings = targetLocated.siblings
  }

  dragLocated.node.parentMenuId = targetParentId

  if (position === 0) {
    targetSiblings.push(dragLocated.node)
  } else {
    const targetIndex = targetSiblings.indexOf(targetLocated.node)
    if (targetIndex < 0) return null
    const insertIndex = position === -1 ? targetIndex : targetIndex + 1
    targetSiblings.splice(insertIndex, 0, dragLocated.node)
  }

  reindexBranchSiblings(targetSiblings)
  if (oldParentId !== targetParentId) {
    reindexBranchSiblings(dragLocated.siblings)
  }

  const updates = collectReorderedUpdates(nodes, nextTree)
  if (updates.length === 0) return null
  return { nextTree, updates }
}
