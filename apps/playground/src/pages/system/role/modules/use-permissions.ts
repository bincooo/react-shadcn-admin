import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  buildKeyEntities,
  conductCheck,
  fillFieldNames,
  filterTreeWithAncestors,
  type TreeKey,
} from '@repo/tree'
import { fetchDeptTree } from '@/api/system/dept'
import { fetchMenuTree } from '@/api/system/menu'
import type { Menu } from '@/api/system/menu'
import {
  assignRoleDataScope,
  assignRoleMenus,
  fetchRoleDataScope,
  fetchRoleMenus,
} from '@/api/system/role'
import type {
  RoleDataScope,
  RoleDataScopeConfig,
  RoleDataScopeInput,
} from '@/api/system/role'
import { errorMessage } from '@/lib/format'

/* ------------------------------- 菜单授权 ------------------------------- */

const EMPTY_MENUS: Menu[] = []
const MENU_FIELD_NAMES = fillFieldNames({
  key: 'id',
  title: 'menuName',
  children: 'children',
})

/** 勾选集合与其所属角色（scope），切换角色时自然回落到该角色的已授权菜单 */
interface RoleMenuSelection {
  scope: string
  checked: string[]
  halfChecked: string[]
}

/**
 * 角色编辑面板的菜单授权状态（查询 + 草稿 + 保存）。
 *
 * 借助 `@repo/tree` 的 `conductCheck` 与 `checkable` 完成父子联动与半选计算；
 * 保存成功后失效授权缓存并回调 `onSaved`。
 */
export function useRoleMenuGrant({
  roleId,
  onSaved,
}: {
  roleId: string
  onSaved: () => void
}) {
  const queryClient = useQueryClient()
  const [selectionState, setSelection] = useState<RoleMenuSelection | null>(
    null,
  )

  const menuTreeQuery = useQuery({
    queryKey: ['menu'],
    queryFn: fetchMenuTree,
  })

  const assignedQuery = useQuery({
    queryKey: ['role-menu', roleId],
    queryFn: () => fetchRoleMenus(roleId),
    // 保存成功时主动失效；面板打开期间不因窗口聚焦重拉
    staleTime: Infinity,
  })

  const rawMenus = menuTreeQuery.data ?? EMPTY_MENUS
  // 只保留含按钮权限的分支：目录/页面作为按钮的上级路径保留，整枝无按钮的节点剪掉
  const menus = useMemo(
    () =>
      filterTreeWithAncestors(rawMenus, (node) => node.menuType === 'BUTTON'),
    [rawMenus],
  )

  const { keyEntities, levelEntities, maxLevel } = useMemo(
    () => buildKeyEntities(menus, MENU_FIELD_NAMES),
    [menus],
  )

  const { visibleIds, leafIds } = useMemo(() => {
    const all = new Set<string>()
    const leaves = new Set<string>()
    for (const [key, entity] of keyEntities) {
      const id = String(key)
      all.add(id)
      if (entity.children.length === 0) {
        leaves.add(id)
      }
    }
    return { visibleIds: all, leafIds: leaves }
  }, [keyEntities])

  // 已授权但不在树中的 id（纯页面等）：保存时原样带回，避免误清空
  const hiddenAssignedIds = useMemo(
    () => (assignedQuery.data ?? []).filter((id) => !visibleIds.has(id)),
    [assignedQuery.data, visibleIds],
  )

  // 从后端授权集合提取叶子按钮 id，交给 conductCheck 推导完整的全选/半选状态
  const initialChecked = useMemo(() => {
    const leafAssigned = (assignedQuery.data ?? []).filter((id) =>
      leafIds.has(id),
    )
    const conducted = conductCheck(
      leafAssigned,
      true,
      keyEntities,
      levelEntities,
      maxLevel,
      MENU_FIELD_NAMES,
    )
    return {
      checked: conducted.checkedKeys.map(String),
      halfChecked: conducted.halfCheckedKeys.map(String),
    }
  }, [assignedQuery.data, leafIds, keyEntities, levelEntities, maxLevel])

  const activeChecked =
    selectionState?.scope === roleId
      ? selectionState.checked
      : initialChecked.checked
  const activeHalfChecked =
    selectionState?.scope === roleId
      ? selectionState.halfChecked
      : initialChecked.halfChecked

  // 保存集合 = 全选节点 + 半选上级节点 + 树中未展示的既有授权
  const saveMenuIds = useMemo(
    () =>
      Array.from(
        new Set([...activeChecked, ...activeHalfChecked, ...hiddenAssignedIds]),
      ),
    [activeChecked, activeHalfChecked, hiddenAssignedIds],
  )

  const saveMutation = useMutation({
    mutationFn: () => assignRoleMenus(roleId, saveMenuIds),
    onSuccess: () => {
      toast.success('菜单授权已保存')
      queryClient.invalidateQueries({
        queryKey: ['role-menu', roleId],
      })
      // 当前用户可能持有该角色，主动失效权限查询以保证即时生效
      queryClient.invalidateQueries({ queryKey: ['auth-permissions'] })
      onSaved()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const setCheckedMenus = (
    checkedKeys: TreeKey[],
    halfCheckedKeys: TreeKey[],
  ) => {
    setSelection({
      scope: roleId,
      checked: checkedKeys.map(String),
      halfChecked: halfCheckedKeys.map(String),
    })
  }

  return {
    menus,
    checkedKeys: activeChecked,
    setCheckedMenus,
    clearMenus: () => setCheckedMenus([], []),
    selectAllMenus: () => setCheckedMenus(Array.from(visibleIds), []),
    selectedCount: activeChecked.length,
    /** 树中可见节点总数，供「全选」按钮判断是否已全部选中 */
    visibleCount: visibleIds.size,
    saveMutation,
    menusLoading: menuTreeQuery.isLoading || assignedQuery.isLoading,
    menusReady: menuTreeQuery.isSuccess && assignedQuery.isSuccess,
    menusError: menuTreeQuery.isError || assignedQuery.isError,
  }
}

export type RoleMenuGrantState = ReturnType<typeof useRoleMenuGrant>

/* ------------------------------- 数据权限 ------------------------------- */

/** 数据权限类型下拉选项（顺序与后端枚举语义一致） */
export const DATA_SCOPE_OPTIONS: ReadonlyArray<{
  value: RoleDataScope
  label: string
}> = [
  { value: 'ALL', label: '全部数据权限' },
  { value: 'CUSTOM', label: '自定义数据权限' },
  { value: 'DEPT', label: '本部门数据权限' },
  { value: 'DEPT_AND_CHILD', label: '本部门及以下数据权限' },
  { value: 'SELF', label: '仅本人数据权限' },
  {
    value: 'DEPT_AND_CHILD_OR_SELF',
    label: '部门及以下或本人数据权限',
  },
]

/** 勾选集合与所属角色（scope），切换角色时回落到该角色的已保存配置 */
interface RoleDataScopeSelection {
  scope: string
  dataScope: RoleDataScope
  deptIds: string[]
}

const EMPTY_DEPT_IDS: string[] = []

/**
 * 角色数据权限配置状态。
 *
 * 数据权限类型与部门勾选集合在未操作前直接取后端已保存配置（无需 effect 回填）；
 * 部门树父子级联与停用节点截断由 `@repo/tree` 原生负责。
 */
export function useRoleDataScope({
  roleId,
  roleCode,
}: {
  roleId: string
  /** 仅用于写回缓存 DTO；接口与缓存键均以 roleId 为准 */
  roleCode: string
}) {
  const queryClient = useQueryClient()
  const [selectionState, setSelection] =
    useState<RoleDataScopeSelection | null>(null)

  const configQuery = useQuery({
    queryKey: ['role-data-scope', roleId],
    queryFn: () => fetchRoleDataScope(roleId),
    // 保存成功时主动失效；面板打开期间不因窗口聚焦重拉
    staleTime: Infinity,
  })

  const deptQuery = useQuery({
    queryKey: ['dept'],
    queryFn: fetchDeptTree,
  })

  const deptTreeState = useMemo(() => deptQuery.data ?? [], [deptQuery.data])

  const savedConfig = configQuery.data
  const dataScopeState =
    selectionState?.scope === roleId
      ? selectionState.dataScope
      : (savedConfig?.dataScope ?? 'ALL')
  const selectedDeptIdsState =
    selectionState?.scope === roleId
      ? selectionState.deptIds
      : (savedConfig?.departmentIds ?? EMPTY_DEPT_IDS)

  const updateSelection = (
    update: (prev: RoleDataScopeSelection) => RoleDataScopeSelection,
  ) =>
    setSelection((prev) => {
      const base: RoleDataScopeSelection =
        prev?.scope === roleId
          ? prev
          : {
              scope: roleId,
              dataScope: savedConfig?.dataScope ?? 'ALL',
              deptIds: [...(savedConfig?.departmentIds ?? [])],
            }
      return update(base)
    })

  const setDataScope = (dataScope: RoleDataScope) =>
    updateSelection((prev) => ({ ...prev, dataScope }))

  const setSelectedDepts = (checkedKeys: TreeKey[]) =>
    updateSelection((prev) => ({
      ...prev,
      deptIds: checkedKeys.map(String),
    }))

  const saveMutation = useMutation({
    mutationFn: ({
      input,
    }: {
      input: RoleDataScopeInput
      draft: RoleDataScopeSelection | null
    }) => assignRoleDataScope(roleId, input),
    onSuccess: (_, { input, draft }) => {
      toast.success('数据权限已保存')
      // 先写入已提交值：缓存失效期间 UI 不会回退到旧配置，也避免二次保存覆盖新值
      const saved: RoleDataScopeConfig = {
        roleCode,
        dataScope: input.dataScope,
        departmentIds: input.departmentIds ?? [],
      }
      queryClient.setQueryData(['role-data-scope', roleId], saved)
      // 只清除本次提交的草稿；请求期间继续编辑时保留后续改动。
      setSelection((current) => (current === draft ? null : current))
      queryClient.invalidateQueries({
        queryKey: ['role-data-scope', roleId],
      })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  /** 保存当前配置：非 CUSTOM 提交空部门列表 */
  const save = () =>
    saveMutation.mutate({
      input: {
        dataScope: dataScopeState,
        departmentIds: dataScopeState === 'CUSTOM' ? selectedDeptIdsState : [],
      },
      draft: selectionState,
    })

  return {
    dataScope: dataScopeState,
    setDataScope,
    deptTree: deptTreeState,
    deptLoading: deptQuery.isLoading,
    deptError: deptQuery.isError,
    configLoading: configQuery.isLoading,
    configError: configQuery.isError,
    selectedDeptIds: selectedDeptIdsState,
    selectedCount: selectedDeptIdsState.length,
    setSelectedDepts,
    save,
    saveMutation,
    // 非 CUSTOM 保存不依赖部门树：配置加载成功即可保存
    ready:
      configQuery.isSuccess &&
      (dataScopeState !== 'CUSTOM' || deptQuery.isSuccess),
  }
}

export type RoleDataScopeState = ReturnType<typeof useRoleDataScope>
