import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tree } from '@/components/core/tree'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { assignSystemRoleMenus } from '@/api/system/role'
import type { SystemRole, SystemRoleDataScope } from '@/api/system/role'
import { errorMessage } from '@/lib/format'
import { useRoleMenusSync } from './use-role-menus-sync'
import {
  DATA_SCOPE_OPTIONS,
  useRoleDataScopeSync,
} from './use-role-data-scope-sync'

/* ------------------------------ 角色权限面板 ------------------------------ */

/**
 * 角色权限面板：顶部 Tabs 分「菜单授权」与「数据权限」两个 tab。
 * 菜单授权按当前勾选全量替换角色授权；数据权限保存角色数据范围，
 * 自定义类型可多选部门。内容组件按角色编码重挂载，切换目标不会串状态。
 */
export function RoleMenusDialog({
  role,
  onClose,
}: {
  role: SystemRole | null
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
        <RoleMenusDialogContent
          key={role.roleCode}
          role={role}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}

function RoleMenusDialogContent({
  role,
  onClose,
}: {
  role: SystemRole
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // 编辑时加载已授权菜单并初始化勾选集合；面板按角色重挂载不会串状态
  const menusSync = useRoleMenusSync({ roleCode: role.roleCode, enabled: true })
  // 数据权限配置与部门树；与菜单授权各自独立保存
  const dataScopeSync = useRoleDataScopeSync({
    roleCode: role.roleCode,
    enabled: true,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      assignSystemRoleMenus(role.roleCode, menusSync.saveMenuCodes),
    onSuccess: () => {
      toast.success(t('system.menu.grantSaved'))
      queryClient.invalidateQueries({
        queryKey: ['system-role-menus', role.roleCode],
      })
      // 当前用户可能持有该角色：权限查询有 60s staleTime，这里主动失效保证即时生效
      queryClient.invalidateQueries({ queryKey: ['auth-permissions'] })
      onClose()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>角色权限</DialogTitle>
        <DialogDescription>
          为角色「{role.roleName}」（{role.roleCode}
          ）配置可访问的菜单与数据范围。
        </DialogDescription>
      </DialogHeader>
      <Tabs defaultValue="menus" className="gap-3">
        <TabsList>
          <TabsTrigger value="menus">菜单授权</TabsTrigger>
          <TabsTrigger value="data">数据权限</TabsTrigger>
        </TabsList>
        <TabsContent value="menus" className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              已选 {menusSync.selectedCount} 项
            </span>
            <div className="flex items-center gap-2">
              {menusSync.visibleCount > 0 &&
                menusSync.selectedCount < menusSync.visibleCount && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1 text-[11px]"
                    onClick={menusSync.selectAllMenus}
                  >
                    全选
                  </Button>
                )}
              {menusSync.selectedCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-[11px]"
                  onClick={menusSync.clearMenus}
                >
                  清空
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-md border p-2">
            {menusSync.menusLoadingState ? (
              <p className="py-6 text-center text-[12px] text-muted-foreground">
                正在加载菜单…
              </p>
            ) : menusSync.menusErrorState ? (
              <p className="py-6 text-center text-[12px] text-destructive">
                菜单加载失败，请关闭面板后重试
              </p>
            ) : menusSync.menus.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-muted-foreground">
                暂无可授权菜单
              </p>
            ) : (
              <Tree
                nodes={menusSync.menus}
                getKey={(menu) => menu.menuCode}
                getChildren={(menu) => menu.children}
                getLabel={(menu) => t(menu.menuName)}
                ariaLabel="{t('system.menu.grantTree')}"
                renderNode={(menu) => {
                  const state = menusSync.getMenuCheckState(menu.menuCode)
                  const checkboxId = `role-menu-${menu.menuCode}`
                  return (
                    <>
                      <Checkbox
                        id={checkboxId}
                        checked={
                          state === 'indeterminate'
                            ? 'indeterminate'
                            : state === 'checked'
                        }
                        onCheckedChange={(checked) =>
                          menusSync.toggleMenu(menu.menuCode, checked === true)
                        }
                      />
                      <label
                        htmlFor={checkboxId}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                      >
                        <span className="truncate text-[12.5px]">
                          {t(menu.menuName)}
                        </span>
                        <span className="truncate font-mono text-[10.5px] text-muted-foreground">
                          {menu.menuCode}
                        </span>
                      </label>
                    </>
                  )
                }}
              />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            仅展示含按钮权限的菜单；勾选父级会一并选中子级，未展示的既有授权会保留。
          </p>
          <DialogFooter className="mt-1">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !menusSync.menusReadyState}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </TabsContent>
        <TabsContent value="data" className="flex flex-col gap-3">
          {dataScopeSync.configLoadingState && (
            <p className="py-2 text-center text-[12px] text-muted-foreground">
              正在加载数据权限…
            </p>
          )}
          {dataScopeSync.configErrorState && (
            <p className="py-2 text-center text-[12px] text-destructive">
              数据权限加载失败，请关闭面板后重试
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="role-data-scope">数据权限类型</Label>
            <Select
              value={dataScopeSync.dataScopeState}
              onValueChange={(value) =>
                dataScopeSync.setDataScope(value as SystemRoleDataScope)
              }
              disabled={!dataScopeSync.readyState}
            >
              <SelectTrigger id="role-data-scope" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {dataScopeSync.dataScopeState === 'CUSTOM' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>自定义部门</Label>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  已选 {dataScopeSync.selectedCount} 个部门
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto rounded-md border p-2">
                {dataScopeSync.deptLoadingState ? (
                  <p className="py-6 text-center text-[12px] text-muted-foreground">
                    正在加载部门…
                  </p>
                ) : dataScopeSync.deptErrorState ? (
                  <p className="py-6 text-center text-[12px] text-destructive">
                    部门加载失败，请关闭面板后重试
                  </p>
                ) : dataScopeSync.deptTreeState.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-muted-foreground">
                    暂无可选部门
                  </p>
                ) : (
                  <Tree
                    nodes={dataScopeSync.deptTreeState}
                    getKey={(dept) => dept.id}
                    getChildren={(dept) => dept.children}
                    getLabel={(dept) => dept.deptName}
                    isDisabled={(dept) => dept.status === 'DISABLED'}
                    ariaLabel="{t('system.role.customScopeTree')}"
                    renderNode={(dept) => {
                      const state = dataScopeSync.getDeptCheckState(dept.id)
                      const checkboxId = `role-dept-${dept.id}`
                      return (
                        <>
                          <Checkbox
                            id={checkboxId}
                            disabled={dept.status === 'DISABLED'}
                            checked={
                              state === 'indeterminate'
                                ? 'indeterminate'
                                : state === 'checked'
                            }
                            onCheckedChange={(checked) =>
                              dataScopeSync.toggleDept(
                                dept.id,
                                checked === true,
                              )
                            }
                          />
                          <label
                            htmlFor={checkboxId}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                          >
                            <span className="truncate text-[12.5px]">
                              {dept.deptName}
                            </span>
                            <span className="truncate font-mono text-[10.5px] text-muted-foreground">
                              {dept.deptCode}
                            </span>
                          </label>
                        </>
                      )
                    }}
                  />
                )}
              </div>
            </div>
          )}
          <DialogFooter className="mt-1">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => dataScopeSync.save()}
              disabled={
                dataScopeSync.saveMutation.isPending ||
                !dataScopeSync.readyState
              }
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </TabsContent>
      </Tabs>
    </DialogContent>
  )
}
