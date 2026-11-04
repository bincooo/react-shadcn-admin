import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  assignSystemRoleDataScope,
  fetchSystemRoleDataScope,
} from '@/api/system/role'
import type {
  SystemRoleDataScope,
  SystemRoleDataScopeConfig,
  SystemRoleDataScopeInput,
} from '@/api/system/role'
import { fetchSystemDeptTree } from '@/api/system/dept'
import { errorMessage } from '@/lib/format'
import { buildRoleTreeIndex } from './role-tree-index'

/** 部门树勾选态 */
type DeptCheckState = 'checked' | 'indeterminate' | 'unchecked'

/** 数据权限类型下拉选项（顺序与后端枚举语义一致，labelKey 交给调用方翻译） */
export const DATA_SCOPE_OPTIONS: ReadonlyArray<{
  value: SystemRoleDataScope
  labelKey: string
}> = [
  { value: 'ALL', labelKey: 'system.dataScope.all' },
  { value: 'CUSTOM', labelKey: 'system.dataScope.custom' },
  { value: 'DEPT', labelKey: 'system.dataScope.dept' },
  { value: 'DEPT_AND_CHILD', labelKey: 'system.dataScope.deptAndChild' },
  { value: 'SELF', labelKey: 'system.dataScope.self' },
  {
    value: 'DEPT_AND_CHILD_OR_SELF',
    labelKey: 'system.dataScope.deptAndChildOrSelf',
  },
]

/** 勾选集合与所属角色（scope），切换角色时回落到该角色的已保存配置 */
interface RoleDataScopeSelection {
  scope: string
  dataScope: SystemRoleDataScope
  deptIds: Set<string>
}

const EMPTY_DEPT_IDS = new Set<string>()

/**
 * 角色数据权限配置状态。
 *
 * 数据权限类型与部门勾选集合在未操作前直接取后端已保存配置（无需 effect 回填）；
 * 操作后以本地草稿为准。保存时非 CUSTOM 类型提交空部门列表。
 */
export function useRoleDataScopeSync({
  roleCode,
  enabled,
}: {
  roleCode: string
  enabled: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectionState, setSelection] =
    useState<RoleDataScopeSelection | null>(null)

  const configQuery = useQuery({
    queryKey: ['system-role-data-scope', roleCode],
    queryFn: () => fetchSystemRoleDataScope(roleCode),
    enabled,
    // 保存成功时主动失效；面板打开期间不因窗口聚焦重拉
    staleTime: Infinity,
  })

  const deptQuery = useQuery({
    queryKey: ['system-depts'],
    queryFn: fetchSystemDeptTree,
    enabled,
  })

  const deptTreeState = useMemo(() => deptQuery.data ?? [], [deptQuery.data])
  const treeIndex = useMemo(
    () =>
      buildRoleTreeIndex({
        nodes: deptTreeState,
        keyOf: (dept) => dept.id,
        childrenOf: (dept) => dept.children,
        // 停用部门可见但不可勾选
        isSelectable: (dept) => dept.status === 'ENABLED',
      }),
    [deptTreeState],
  )

  const savedConfig = configQuery.data
  const dataScopeState =
    selectionState?.scope === roleCode
      ? selectionState.dataScope
      : (savedConfig?.dataScope ?? 'ALL')
  const selectedDeptIdsState =
    selectionState?.scope === roleCode
      ? selectionState.deptIds
      : savedConfig
        ? new Set(savedConfig.departmentIds)
        : EMPTY_DEPT_IDS

  const updateSelection = (
    update: (prev: RoleDataScopeSelection) => RoleDataScopeSelection,
  ) =>
    setSelection((prev) => {
      const base: RoleDataScopeSelection =
        prev?.scope === roleCode
          ? prev
          : {
              scope: roleCode,
              dataScope: savedConfig?.dataScope ?? 'ALL',
              deptIds: new Set(savedConfig?.departmentIds ?? []),
            }
      return update(base)
    })

  const setDataScope = (dataScope: SystemRoleDataScope) =>
    updateSelection((prev) => ({ ...prev, dataScope }))

  /** 节点三态：按自身及后代中的启用部门聚合 */
  const getDeptCheckState = (deptId: string): DeptCheckState => {
    const selectable = treeIndex.selectableByKey.get(deptId) ?? EMPTY_DEPT_IDS
    if (selectable.size === 0) return 'unchecked'
    let checked = 0
    for (const id of selectable) {
      if (selectedDeptIdsState.has(id)) checked += 1
    }
    if (checked === selectable.size) return 'checked'
    return checked === 0 ? 'unchecked' : 'indeterminate'
  }

  /** 勾选/取消节点及其全部可选的启用后代 */
  const toggleDept = (deptId: string, checked: boolean) => {
    const selectable = treeIndex.selectableByKey.get(deptId) ?? EMPTY_DEPT_IDS
    updateSelection((prev) => {
      const next = new Set(prev.deptIds)
      for (const id of selectable) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return { ...prev, deptIds: next }
    })
  }

  const saveMutation = useMutation({
    mutationFn: (input: SystemRoleDataScopeInput) =>
      assignSystemRoleDataScope(roleCode, input),
    onSuccess: (_, input) => {
      toast.success(t('system.dataScope.saved'))
      // 先写入已提交值：缓存失效期间 UI 不会回退到旧配置，也避免二次保存覆盖新值
      const saved: SystemRoleDataScopeConfig = {
        roleCode,
        dataScope: input.dataScope,
        departmentIds: input.departmentIds ?? [],
      }
      queryClient.setQueryData(['system-role-data-scope', roleCode], saved)
      // 保存后以服务端配置为准，清空本地草稿
      setSelection(null)
      queryClient.invalidateQueries({
        queryKey: ['system-role-data-scope', roleCode],
      })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  /** 保存当前配置：非 CUSTOM 提交空部门列表 */
  const save = () =>
    saveMutation.mutate({
      dataScope: dataScopeState,
      departmentIds:
        dataScopeState === 'CUSTOM' ? [...selectedDeptIdsState] : [],
    })

  return {
    dataScopeState,
    setDataScope,
    deptTreeState,
    deptLoadingState: deptQuery.isLoading,
    deptErrorState: deptQuery.isError,
    configLoadingState: configQuery.isLoading,
    configErrorState: configQuery.isError,
    selectedDeptIdsState,
    selectedCount: selectedDeptIdsState.size,
    getDeptCheckState,
    toggleDept,
    save,
    saveMutation,
    // 非 CUSTOM 保存不依赖部门树：配置加载成功即可保存
    readyState:
      configQuery.isSuccess &&
      (dataScopeState !== 'CUSTOM' || deptQuery.isSuccess),
  }
}
