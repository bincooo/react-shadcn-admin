import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSystemRoleMenus } from '@/api/system/role'
import { fetchSystemMenuTree } from '@/api/system/menu'
import type { SystemMenu } from '@/api/system/menu'
import { buildRoleTreeIndex } from './role-tree-index'

/** 菜单树的勾选态 */
type MenuCheckState = 'checked' | 'indeterminate' | 'unchecked'

const EMPTY_MENUS: SystemMenu[] = []

/** 子树中是否含按钮权限（BUTTON 节点） */
function containsButtonPermission(node: SystemMenu): boolean {
  if (node.menuType === 'BUTTON') return true
  return (node.children ?? []).some(containsButtonPermission)
}

/**
 * 只保留包含按钮权限的分支：目录/页面节点作为按钮的上级路径保留，
 * 整棵子树都没有按钮权限的节点被过滤掉（如纯展示页面）。
 */
function filterButtonPermittedMenus(nodes: SystemMenu[]): SystemMenu[] {
  const result: SystemMenu[] = []
  for (const node of nodes) {
    if (!containsButtonPermission(node)) continue
    result.push({
      ...node,
      children: node.children
        ? filterButtonPermittedMenus(node.children)
        : undefined,
    })
  }
  return result
}

/** 平铺收集树中全部节点编码 */
function collectCodes(nodes: SystemMenu[], acc = new Set<string>()) {
  for (const node of nodes) {
    acc.add(node.menuCode)
    collectCodes(node.children ?? [], acc)
  }
  return acc
}

/**
 * 角色编辑面板的菜单授权状态。
 *
 * 创建角色时只加载菜单树；编辑时并行加载已授权菜单，并在数据到达后
 * 初始化一次勾选集合（面板按角色重挂载，不会串状态）。勾选父级会级联
 * 选中全部子级，保存时自动补齐已选节点的上级菜单。
 *
 * 树只展示包含按钮权限的分支；不在树中的已授权菜单（如纯页面）无法在
 * 界面上操作，保存时原样保留，避免一次保存清空不可见的既有授权。
 */
const CREATE_SCOPE = '__create__'

/** 勾选集合与其所属角色（scope），切换角色时自然回落到该角色的已授权菜单 */
interface RoleMenuSelection {
  scope: string
  codes: Set<string>
}

export function useRoleMenusSync({
  roleCode,
  enabled,
}: {
  roleCode: string | null
  enabled: boolean
}) {
  const scopeKey = roleCode ?? CREATE_SCOPE
  const [selectionState, setSelection] = useState<RoleMenuSelection | null>(
    null,
  )

  const menuTreeQuery = useQuery({
    queryKey: ['system-menus'],
    queryFn: fetchSystemMenuTree,
    enabled,
  })

  const assignedQuery = useQuery({
    queryKey: ['system-role-menus', roleCode],
    queryFn: async () =>
      roleCode === null ? [] : fetchSystemRoleMenus(roleCode),
    enabled: enabled && roleCode !== null,
    // 保存成功时主动失效；面板打开期间不因窗口聚焦重拉
    staleTime: Infinity,
  })

  const rawMenus = menuTreeQuery.data ?? EMPTY_MENUS
  // 过滤后只保留含按钮权限的分支；useMemo 保持引用稳定，避免索引重算
  const menus = useMemo(() => filterButtonPermittedMenus(rawMenus), [rawMenus])
  const visibleCodes = useMemo(() => collectCodes(menus), [menus])
  const treeIndex = useMemo(
    () =>
      buildRoleTreeIndex({
        nodes: menus,
        keyOf: (menu) => menu.menuCode,
        childrenOf: (menu) => menu.children,
      }),
    [menus],
  )

  // 已授权但不在树中的编码（纯页面等）：保存时原样带回，避免误清空
  const hiddenAssignedCodes = useMemo(
    () => (assignedQuery.data ?? []).filter((code) => !visibleCodes.has(code)),
    [assignedQuery.data, visibleCodes],
  )

  // 已授权且可在树中展示的编码：未操作前即作为初始勾选集合（无需 effect 回填）
  const assignedVisibleCodes = useMemo(
    () =>
      new Set(
        (assignedQuery.data ?? []).filter((code) => visibleCodes.has(code)),
      ),
    [assignedQuery.data, visibleCodes],
  )
  const selectedState =
    selectionState?.scope === scopeKey
      ? selectionState.codes
      : assignedVisibleCodes

  const updateSelected = (update: (prev: Set<string>) => Set<string>) =>
    setSelection({ scope: scopeKey, codes: update(new Set(selectedState)) })

  // 每个节点的三态：子级全选为选中，部分选中为半选
  const checkStateByCode = useMemo(() => {
    const states = new Map<string, MenuCheckState>()

    const visit = (node: SystemMenu): MenuCheckState => {
      const children = node.children ?? []
      const selfSelected = selectedState.has(node.menuCode)
      if (children.length === 0) {
        const state: MenuCheckState = selfSelected ? 'checked' : 'unchecked'
        states.set(node.menuCode, state)
        return state
      }
      let allChecked = selfSelected
      let someChecked = selfSelected
      for (const child of children) {
        const childState = visit(child)
        if (childState !== 'checked') allChecked = false
        if (childState !== 'unchecked') someChecked = true
      }
      const state: MenuCheckState = allChecked
        ? 'checked'
        : someChecked
          ? 'indeterminate'
          : 'unchecked'
      states.set(node.menuCode, state)
      return state
    }

    for (const menu of menus) visit(menu)
    return states
  }, [menus, selectedState])

  // 保存集合 = 勾选节点 + 它们的全部上级 + 树中未展示的既有授权
  const saveMenuCodes = useMemo(() => {
    const codes = new Set(selectedState)
    for (const code of selectedState) {
      let parentCode = treeIndex.parentByKey.get(code) ?? null
      while (parentCode) {
        codes.add(parentCode)
        parentCode = treeIndex.parentByKey.get(parentCode) ?? null
      }
    }
    for (const code of hiddenAssignedCodes) codes.add(code)
    return [...codes]
  }, [selectedState, treeIndex, hiddenAssignedCodes])

  /** 勾选/取消节点及其全部后代 */
  const toggleMenu = (menuCode: string, checked: boolean) => {
    const subtree = treeIndex.subtreeByKey.get(menuCode) ?? new Set([menuCode])
    updateSelected((prev) => {
      const next = new Set(prev)
      for (const code of subtree) {
        if (checked) {
          next.add(code)
        } else {
          next.delete(code)
        }
      }
      return next
    })
  }

  return {
    menus,
    getMenuCheckState: (menuCode: string): MenuCheckState =>
      checkStateByCode.get(menuCode) ?? 'unchecked',
    toggleMenu,
    clearMenus: () => updateSelected(() => new Set()),
    // 全选树中全部可见节点；未展示的既有授权仍由 saveMenuCodes 原样带回
    selectAllMenus: () => updateSelected(() => new Set(visibleCodes)),
    selectedCount: selectedState.size,
    /** 树中可见节点总数，供「全选」按钮判断是否已全部选中 */
    visibleCount: visibleCodes.size,
    saveMenuCodes,
    menusLoadingState:
      menuTreeQuery.isLoading || (roleCode !== null && assignedQuery.isLoading),
    menusReadyState:
      menuTreeQuery.isSuccess && (roleCode === null || assignedQuery.isSuccess),
    menusErrorState:
      menuTreeQuery.isError || (roleCode !== null && assignedQuery.isError),
  }
}
