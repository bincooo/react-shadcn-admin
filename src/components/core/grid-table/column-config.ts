/**
 * GridTable 列配置的数据模型。
 *
 * 表格的列结构（分组 / 顺序）从这里派生：面板编辑一份草稿，点「确认」后
 * 由 GridTable 重建 rc-table 的列定义。分组可以任意嵌套，叶子列 id 保持不变，
 * 所以列宽、显隐、固定等按列 id 保存的表格状态不会因为分组调整而丢失。
 */

export interface ConfigLeaf {
  kind: 'leaf'
  id: string
}

export interface ConfigGroup {
  kind: 'group'
  id: string
  /** 自定义分组名；为空时回退到列定义里的 header */
  label?: string
  children: ConfigItem[]
}

export type ConfigItem = ConfigLeaf | ConfigGroup

/** 拖拽源：叶子列或分组 */
export type ConfigItemRef =
  { kind: 'leaf'; id: string } | { kind: 'group'; id: string }

/** 打开面板时的初始值快照 */
export interface ColumnConfigSnapshot {
  items: ConfigItem[]
  /** 叶子列 id → 是否可见 */
  visibility: Record<string, boolean>
  pinning: { start: string[]; end: string[] }
}

/** 相对目标行的插入位置 */
export type DropPosition = 'before' | 'after'
/** 深拷贝列配置，避免编辑态直接改动已持久化的对象 */
export function cloneConfig(items: ConfigItem[]): ConfigItem[] {
  return items.map((item) =>
    item.kind === 'group'
      ? { ...item, children: cloneConfig(item.children) }
      : { ...item },
  )
}

/** 按展示顺序收集所有叶子列 id（任意深度） */
export function collectLeafKeys(items: ConfigItem[]): string[] {
  return items.flatMap((item) =>
    item.kind === 'group' ? collectLeafKeys(item.children) : [item.id],
  )
}

/** 确认时丢弃没有成员的空分组（草稿里允许存在，方便先建组再拖入） */
export function pruneEmptyGroups(items: ConfigItem[]): ConfigItem[] {
  return items
    .map((item) =>
      item.kind === 'group'
        ? { ...item, children: pruneEmptyGroups(item.children) }
        : item,
    )
    .filter((item) => item.kind !== 'group' || item.children.length > 0)
}

/** id 是否出现在这棵子树里 */
export function containsId(items: ConfigItem[], id: string): boolean {
  return items.some(
    (item) =>
      item.id === id ||
      (item.kind === 'group' && containsId(item.children, id)),
  )
}

/** 按 id 查找任意层级的项 */
export function findItem(
  items: ConfigItem[],
  id: string,
): ConfigItem | undefined {
  for (const item of items) {
    if (item.id === id) return item
    if (item.kind === 'group') {
      const found = findItem(item.children, id)
      if (found) return found
    }
  }
  return undefined
}

/** 从树中摘掉一个项（叶子或分组），保留可能变空的分组 */
export function detachItem(items: ConfigItem[], id: string): ConfigItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) =>
      item.kind === 'group'
        ? { ...item, children: detachItem(item.children, id) }
        : item,
    )
}

/** 把项插入分组：`referenceId` + `position` 决定插到该子项前 / 后，缺省追加末尾 */
export function insertIntoGroup(
  items: ConfigItem[],
  groupId: string,
  item: ConfigItem,
  referenceId?: string,
  position: DropPosition = 'before',
): ConfigItem[] {
  return items.map((node) => {
    if (node.kind !== 'group') return node
    if (node.id !== groupId) {
      return {
        ...node,
        children: insertIntoGroup(
          node.children,
          groupId,
          item,
          referenceId,
          position,
        ),
      }
    }
    const children = node.children.filter((child) => child.id !== item.id)
    const index = referenceId
      ? children.findIndex((child) => child.id === referenceId)
      : -1
    if (index >= 0) {
      children.splice(position === 'after' ? index + 1 : index, 0, item)
    } else {
      children.push(item)
    }
    return { ...node, children }
  })
}

/** 在 `referenceId` 所在层级把它前 / 后插入一项；找不到参照项时原样返回 */
function insertBeside(
  items: ConfigItem[],
  referenceId: string,
  item: ConfigItem,
  position: DropPosition,
): ConfigItem[] | null {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === referenceId) {
      const next = [...items]
      next.splice(position === 'after' ? i + 1 : i, 0, item)
      return next
    }
  }
  for (const node of items) {
    if (node.kind !== 'group') continue
    const children = insertBeside(node.children, referenceId, item, position)
    if (children) {
      return items.map((n) => (n.id === node.id ? { ...n, children } : n))
    }
  }
  return null
}

/** 把任意项移动到 `referenceId` 前 / 后（与它同层级，可在任意深度） */
export function moveBeside(
  items: ConfigItem[],
  source: ConfigItemRef,
  referenceId: string,
  position: DropPosition = 'before',
): ConfigItem[] {
  const moved = findItem(items, source.id)
  if (!moved) return items
  const detached = detachItem(items, source.id)
  // 参照项随 source 一起被摘掉（source 是它的祖先）时无法落点，放弃移动
  return insertBeside(detached, referenceId, moved, position) ?? items
}

/** 把任意项移动到顶层 `referenceId` 前 / 后；目标不存在时追加到末尾 */
export function moveToTopLevel(
  items: ConfigItem[],
  source: ConfigItemRef,
  referenceId: string,
  position: DropPosition = 'before',
): ConfigItem[] {
  const moved = findItem(items, source.id)
  if (!moved) return items
  const rest = detachItem(items, source.id)
  const index = rest.findIndex((item) => item.id === referenceId)
  const next = [...rest]
  next.splice(
    index < 0 ? next.length : position === 'after' ? index + 1 : index,
    0,
    moved,
  )
  return next
}

/** 拆解分组：用它的子项原地替换该分组（子项里的嵌套分组随之上一级） */
export function flattenGroup(
  items: ConfigItem[],
  groupId: string,
): ConfigItem[] {
  return items.flatMap((item) => {
    if (item.kind !== 'group') return [item]
    if (item.id === groupId) return item.children
    return [{ ...item, children: flattenGroup(item.children, groupId) }]
  })
}

/** 重命名分组（任意深度） */
export function renameGroup(
  items: ConfigItem[],
  groupId: string,
  label: string,
): ConfigItem[] {
  return items.map((item) => {
    if (item.kind !== 'group') return item
    if (item.id === groupId) return { ...item, label }
    return { ...item, children: renameGroup(item.children, groupId, label) }
  })
}
