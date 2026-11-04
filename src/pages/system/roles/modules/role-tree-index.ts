/**
 * 角色权限面板的树索引工具。
 *
 * 菜单授权与数据权限两个面板都要在「父子联动的树」上做同一件事：
 * 由一棵树算出每个节点的子树集合，并额外记录父节点 / 可勾选子集。
 * 差异只在「哪些节点可勾选」这一条规则上，因此抽成接受 `keyOf` 与
 * `isSelectable` 的通用构建函数，避免两处各写一遍递归。
 */
export interface RoleTreeIndex {
  /** 节点 key → 父节点 key；根节点为 null */
  parentByKey: Map<string, string | null>
  /** 节点 key → 其自身及全部后代 key */
  subtreeByKey: Map<string, Set<string>>
  /** 节点 key → 其自身及后代中「可勾选」的 key 子集 */
  selectableByKey: Map<string, Set<string>>
}

/**
 * 由树构建索引。
 *
 * @param nodes 树（children 为 null/空数组表示叶子）
 * @param keyOf 取节点唯一 key
 * @param childrenOf 取子节点列表
 * @param isSelectable 勾选规则；不传则所有节点都可勾选
 */
export function buildRoleTreeIndex<T>({
  nodes,
  keyOf,
  childrenOf,
  isSelectable = () => true,
}: {
  nodes: readonly T[]
  keyOf: (node: T) => string
  childrenOf: (node: T) => readonly T[] | null | undefined
  isSelectable?: (node: T) => boolean
}): RoleTreeIndex {
  const parentByKey = new Map<string, string | null>()
  const subtreeByKey = new Map<string, Set<string>>()
  const selectableByKey = new Map<string, Set<string>>()

  const visit = (node: T, parentKey: string | null): Set<string> => {
    const key = keyOf(node)
    parentByKey.set(key, parentKey)

    const subtree = new Set<string>([key])
    const selectable = new Set<string>(isSelectable(node) ? [key] : [])

    for (const child of childrenOf(node) ?? []) {
      for (const childKey of visit(child, key)) {
        subtree.add(childKey)
      }
      // 子节点索引此时已写入，直接取用可避免重复遍历子树
      for (const childKey of selectableByKey.get(keyOf(child)) ?? []) {
        selectable.add(childKey)
      }
    }

    subtreeByKey.set(key, subtree)
    selectableByKey.set(key, selectable)
    return subtree
  }

  for (const node of nodes) visit(node, null)
  return { parentByKey, subtreeByKey, selectableByKey }
}
