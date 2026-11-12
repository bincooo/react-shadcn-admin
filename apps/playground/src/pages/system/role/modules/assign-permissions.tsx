import { useMemo, type ReactNode } from 'react'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'
import {
  mapTree,
  Tree,
  type BasicDataNode,
  type TreeFieldNames,
  type TreeKey,
} from '@repo/tree'
import type { Role, RoleDataScope } from '@/api/system/role'
import { menuNameLabel } from '@/pages/system/menu/modules/model'
import { cn } from '@/lib/utils'
import {
  DATA_SCOPE_OPTIONS,
  useRoleDataScope,
  useRoleMenuGrant,
} from './use-permissions'
import type { RoleDataScopeState, RoleMenuGrantState } from './use-permissions'

/* ------------------------------- 复选树 ------------------------------- */

interface CheckboxTreeProps<T extends BasicDataNode> {
  nodes: readonly T[]
  getKey: (node: T) => string
  getChildren: (node: T) => readonly T[] | null | undefined
  getLabel: (node: T) => string
  /** 名称右侧的等宽辅助信息：菜单编码 / 部门编码 */
  getMeta: (node: T) => string
  checkedKeys: TreeKey[]
  isDisabled?: (node: T) => boolean
  onCheck: (checkedKeys: TreeKey[], halfCheckedKeys: TreeKey[]) => void
  ariaLabel: string
}

interface InternalCheckboxNode<T> extends BasicDataNode {
  _key: string
  _label: string
  _disabled: boolean
  _raw: T
  _children?: InternalCheckboxNode<T>[]
}

const CHECKBOX_TREE_FIELD_NAMES: TreeFieldNames = {
  key: '_key',
  title: '_label',
  children: '_children',
  disabled: '_disabled',
}

/** 树面板的加载 / 失败 / 空态提示：两个权限 tab 共用同一排版与色阶 */
function TreePanelMessage({
  error,
  children,
}: {
  error?: boolean
  children: ReactNode
}) {
  return (
    <p
      className={cn(
        'py-6 text-center text-[12px]',
        error ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {children}
    </p>
  )
}

/**
 * 复选树：角色权限面板的「菜单授权」与「数据权限」共用。
 *
 * 直接基于 antd 风格的 `@repo/tree`（`checkable` + 父子级联 + `disabled` 传导截断），
 * 只需注入各字段读取器与勾选回调。
 */
function CheckboxTree<T extends BasicDataNode>({
  nodes,
  getKey,
  getChildren,
  getLabel,
  getMeta,
  checkedKeys,
  isDisabled,
  onCheck,
  ariaLabel,
}: CheckboxTreeProps<T>) {
  const treeData = useMemo(
    () =>
      mapTree<T, InternalCheckboxNode<T>>(
        nodes,
        (node, children) => ({
          _key: getKey(node),
          _label: getLabel(node),
          _disabled: isDisabled?.(node) ?? false,
          _raw: node,
          _children: children.length > 0 ? children : undefined,
        }),
        getChildren,
      ),
    [nodes, getKey, getLabel, isDisabled, getChildren],
  )

  return (
    <Tree<InternalCheckboxNode<T>>
      treeData={treeData}
      fieldNames={CHECKBOX_TREE_FIELD_NAMES}
      checkable
      selectable={false}
      blockNode
      showLine={{ showLeafIcon: false }}
      defaultExpandAll
      checkedKeys={checkedKeys}
      ariaLabel={ariaLabel}
      onCheck={(keys, info) => {
        const nextChecked = Array.isArray(keys) ? keys : keys.checked
        onCheck(nextChecked, info.halfCheckedKeys ?? [])
      }}
      titleRender={(item) => (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[12.5px]">{item._label}</span>
          <span className="truncate font-mono text-[10.5px] text-muted-foreground">
            {getMeta(item._raw)}
          </span>
        </span>
      )}
    />
  )
}

/* ------------------------------- 菜单授权 ------------------------------- */

/** 菜单授权 Tab：展示含按钮权限的菜单树，勾选父级会级联选中子级 */
function MenuGrantTab({
  sync,
  onClose,
}: {
  sync: RoleMenuGrantState
  onClose: () => void
}) {
  let tree: ReactNode
  if (sync.menusLoading) {
    tree = <TreePanelMessage>{'正在加载菜单…'}</TreePanelMessage>
  } else if (sync.menusError) {
    tree = (
      <TreePanelMessage error>
        {'菜单加载失败，请关闭面板后重试'}
      </TreePanelMessage>
    )
  } else if (sync.menus.length === 0) {
    tree = <TreePanelMessage>{'暂无可授权菜单'}</TreePanelMessage>
  } else {
    tree = (
      <CheckboxTree
        nodes={sync.menus}
        getKey={(menu) => menu.id}
        getChildren={(menu) => menu.children}
        getLabel={(menu) => menuNameLabel(menu.menuName)}
        getMeta={(menu) => menu.menuCode}
        checkedKeys={sync.checkedKeys}
        onCheck={(checked, halfChecked) =>
          sync.setCheckedMenus(checked, halfChecked)
        }
        ariaLabel={'菜单授权树'}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {`已选 ${sync.selectedCount} 项`}
        </span>
        <div className="flex items-center gap-2">
          {sync.visibleCount > 0 && sync.selectedCount < sync.visibleCount && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-[11px]"
              onClick={sync.selectAllMenus}
            >
              {'全选'}
            </Button>
          )}
          {sync.selectedCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-[11px]"
              onClick={sync.clearMenus}
            >
              {'清空'}
            </Button>
          )}
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto rounded-md border p-2">
        {tree}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {
          '仅展示含按钮权限的菜单；勾选父级会一并选中子级，未展示的既有授权会保留。'
        }
      </p>
      <DialogFooter className="mt-1">
        <Button variant="outline" onClick={onClose}>
          {'取消'}
        </Button>
        <Button
          onClick={() => sync.saveMutation.mutate()}
          disabled={sync.saveMutation.isPending || !sync.menusReady}
        >
          {'保存'}
        </Button>
      </DialogFooter>
    </div>
  )
}

/* ------------------------------- 数据权限 ------------------------------- */

/** 数据权限 Tab：选择数据范围；仅 CUSTOM 需要勾选部门 */
function DataScopeTab({
  sync,
  onClose,
}: {
  sync: RoleDataScopeState
  onClose: () => void
}) {
  let deptTree: ReactNode
  if (sync.deptLoading) {
    deptTree = <TreePanelMessage>{'正在加载部门…'}</TreePanelMessage>
  } else if (sync.deptError) {
    deptTree = (
      <TreePanelMessage error>
        {'部门加载失败，请关闭面板后重试'}
      </TreePanelMessage>
    )
  } else if (sync.deptTree.length === 0) {
    deptTree = <TreePanelMessage>{'暂无可选部门'}</TreePanelMessage>
  } else {
    deptTree = (
      <CheckboxTree
        nodes={sync.deptTree}
        getKey={(dept) => dept.id}
        getChildren={(dept) => dept.children}
        getLabel={(dept) => dept.deptName}
        getMeta={(dept) => dept.deptCode}
        checkedKeys={sync.selectedDeptIds}
        isDisabled={(dept) => dept.status === 'DISABLED'}
        onCheck={(checked) => sync.setSelectedDepts(checked)}
        ariaLabel={'自定义数据权限部门树'}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sync.configLoading && (
        <p className="py-2 text-center text-[12px] text-muted-foreground">
          {'正在加载数据权限…'}
        </p>
      )}
      {sync.configError && (
        <p className="py-2 text-center text-[12px] text-destructive">
          {'数据权限加载失败，请关闭面板后重试'}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="role-data-scope">{'数据权限类型'}</Label>
        <Select
          value={sync.dataScope}
          items={DATA_SCOPE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          onValueChange={(value) => sync.setDataScope(value as RoleDataScope)}
          disabled={!sync.ready}
        >
          <SelectTrigger id="role-data-scope" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATA_SCOPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {sync.dataScope === 'CUSTOM' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label>{'自定义部门'}</Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {`已选 ${sync.selectedCount} 个部门`}
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto rounded-md border p-2">
            {deptTree}
          </div>
        </div>
      )}
      <DialogFooter className="mt-1">
        <Button variant="outline" onClick={onClose}>
          {'取消'}
        </Button>
        <Button
          onClick={() => sync.save()}
          disabled={sync.saveMutation.isPending || !sync.ready}
        >
          {'保存'}
        </Button>
      </DialogFooter>
    </div>
  )
}

/* ------------------------------- 权限面板 ------------------------------- */

/**
 * 角色权限面板：顶部 Tabs 分「菜单授权」与「数据权限」两个 tab。
 * 菜单授权按当前勾选全量替换角色授权；数据权限保存角色数据范围，
 * 自定义类型可多选部门。内容组件按角色 id 重挂载，切换目标不会串状态。
 */
export function AssignPermissionsDialog({
  role,
  onClose,
}: {
  role: Role | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={role !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {role && (
        <AssignPermissionsDialogContent
          key={role.id}
          role={role}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}

function AssignPermissionsDialogContent({
  role,
  onClose,
}: {
  role: Role
  onClose: () => void
}) {
  // 两个面板各自持有查询、草稿与保存；弹窗只负责布局
  const menuGrant = useRoleMenuGrant({ roleId: role.id, onSaved: onClose })
  const dataScope = useRoleDataScope({
    roleId: role.id,
    roleCode: role.roleCode,
  })

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{'角色权限'}</DialogTitle>
        <DialogDescription>
          {`为角色「${role.roleName}」（${role.roleCode}）配置可访问的菜单与数据范围。`}
        </DialogDescription>
      </DialogHeader>
      <Tabs defaultValue="menus" className="gap-3">
        <TabsList>
          <TabsTrigger value="menus">{'菜单授权'}</TabsTrigger>
          <TabsTrigger value="data">{'数据权限'}</TabsTrigger>
        </TabsList>
        <TabsContent value="menus">
          <MenuGrantTab sync={menuGrant} onClose={onClose} />
        </TabsContent>
        <TabsContent value="data">
          <DataScopeTab sync={dataScope} onClose={onClose} />
        </TabsContent>
      </Tabs>
    </DialogContent>
  )
}
