import type { TreeSelectNode } from '@/components/ui/tree-select'
import type { SystemDeptTreeNode } from '@/api/system/dept'

/** 部门树 → 树形选择节点的映射选项 */
interface DeptTreeSelectOptions {
  /** 命中时连同整棵子树剪掉：编辑部门时传自身 id，避免挂到自己的后代下形成环 */
  excludeIds?: Set<string>
  /** 命中时标记为不可选：停用部门保留结构用于展示既有绑定，但不能被新绑定 */
  disabledIds?: Set<string>
}

/** 部门树 → 树形选择节点；excludeIds 先剪枝，禁用节点保留（可见不可选） */
export function toDeptTreeSelectNodes(
  nodes: SystemDeptTreeNode[],
  options?: DeptTreeSelectOptions,
): TreeSelectNode[] {
  const result: TreeSelectNode[] = []
  for (const node of nodes) {
    if (options?.excludeIds?.has(node.id)) continue
    result.push({
      id: node.id,
      label: node.deptName,
      disabled: options?.disabledIds?.has(node.id) || undefined,
      children: node.children?.length
        ? toDeptTreeSelectNodes(node.children, options)
        : null,
    })
  }
  return result
}

/** 收集全部停用部门 id，供树形选择标记不可选 */
export function collectDisabledDeptIds(
  nodes: SystemDeptTreeNode[],
  ids: Set<string> = new Set(),
): Set<string> {
  for (const node of nodes) {
    if (node.status === 'DISABLED') ids.add(node.id)
    if (node.children?.length) collectDisabledDeptIds(node.children, ids)
  }
  return ids
}
