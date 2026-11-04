import { del, get, post, put } from '@/lib/http'
import type { PageResult } from '@/types'
import type { SystemUser } from '../user'

/** 角色启用状态 */
export type SystemRoleStatus = 'ENABLED' | 'DISABLED'

/** 后端 RoleDTO：角色编码即业务主键，创建后不可改 */
export interface SystemRole {
  roleCode: string
  roleName: string
  description: string | null
  status: SystemRoleStatus
  createdAt: string
}

/** 创建角色表单输入（后端固定新建为启用） */
export interface SystemRoleCreateInput {
  roleCode: string
  roleName: string
  description?: string
}

/** 编辑角色表单输入；status 省略表示不变更 */
export interface SystemRoleUpdateInput {
  roleName: string
  description?: string
  status?: SystemRoleStatus
}

/** 数据权限范围（与后端 RoleDataScope 枚举一致） */
export type SystemRoleDataScope =
  | 'ALL'
  | 'CUSTOM'
  | 'DEPT'
  | 'DEPT_AND_CHILD'
  | 'SELF'
  | 'DEPT_AND_CHILD_OR_SELF'

/** 后端 RoleDataScopeDTO：部门 id 为字符串（雪花 long 防精度丢失） */
export interface SystemRoleDataScopeConfig {
  roleCode: string
  dataScope: SystemRoleDataScope
  departmentIds: string[]
}

/** 数据权限保存输入；departmentIds 仅在 CUSTOM 时生效 */
export interface SystemRoleDataScopeInput {
  dataScope: SystemRoleDataScope
  departmentIds?: string[]
}

/** 分页查询角色（keyword 按角色编码/名称模糊匹配） */
export function fetchSystemRoles(params: {
  page: number
  size: number
  keyword?: string
}) {
  return get<PageResult<SystemRole>>('/roles', params)
}

/** 创建角色（roleCode 唯一，创建后不可改） */
export function createSystemRole(input: SystemRoleCreateInput) {
  return post<SystemRole>('/roles', input)
}

/** 更新角色（名称、描述、启用状态） */
export function updateSystemRole(
  roleCode: string,
  input: SystemRoleUpdateInput,
) {
  return put<SystemRole>(`/roles/${encodeURIComponent(roleCode)}`, input)
}

/** 删除角色；后端同时清理该角色的用户与菜单关联 */
export function deleteSystemRole(roleCode: string) {
  return del<void>(`/roles/${encodeURIComponent(roleCode)}`)
}

/** 查询某角色已分配的用户列表 */
export function fetchSystemRoleUsers(roleCode: string) {
  return get<SystemUser[]>(`/roles/${encodeURIComponent(roleCode)}/users`)
}

/** 全量替换某角色的用户分配；传空数组表示清空 */
export function assignSystemRoleUsers(roleCode: string, userIds: string[]) {
  return put<void>(`/roles/${encodeURIComponent(roleCode)}/users`, { userIds })
}

/** 查询某角色已授权的菜单编码列表 */
export function fetchSystemRoleMenus(roleCode: string) {
  return get<string[]>(`/roles/${encodeURIComponent(roleCode)}/menus`)
}

/** 查询角色的数据权限配置（自定义类型时含部门 id 列表） */
export function fetchSystemRoleDataScope(roleCode: string) {
  return get<SystemRoleDataScopeConfig>(
    `/roles/${encodeURIComponent(roleCode)}/data-scope`,
  )
}

/** 保存角色的数据权限配置；非 CUSTOM 类型后端会清空自定义部门 */
export function assignSystemRoleDataScope(
  roleCode: string,
  input: SystemRoleDataScopeInput,
) {
  return put<void>(`/roles/${encodeURIComponent(roleCode)}/data-scope`, input)
}

/** 全量替换某角色的菜单授权；传空数组表示清空 */
export function assignSystemRoleMenus(roleCode: string, menuCodes: string[]) {
  return put<void>(`/roles/${encodeURIComponent(roleCode)}/menus`, {
    menuCodes,
  })
}
