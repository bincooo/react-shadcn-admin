import { del, get, post, put } from '@/lib/http'
import type { PageResult } from '@/types'
import type { User } from './user'

/** 角色启用状态 */
export type RoleStatus = 'ENABLED' | 'DISABLED'

/** 后端 RoleDTO：id 是雪花代理主键（字符串），roleCode 是唯一业务键、创建后不可改 */
export interface Role {
  id: string
  roleCode: string
  roleName: string
  description?: string
  status: RoleStatus
  createdAt: string
}

/** 创建角色表单输入（后端固定新建为启用） */
export interface RoleCreateInput {
  roleCode: string
  roleName: string
  description?: string
}

/** 编辑角色表单输入；status 省略表示不变更 */
export interface RoleUpdateInput {
  roleName: string
  description?: string
  status?: RoleStatus
}

/** 数据权限范围（与后端 RoleDataScope 枚举一致） */
export type RoleDataScope =
  | 'ALL'
  | 'CUSTOM'
  | 'DEPT'
  | 'DEPT_AND_CHILD'
  | 'SELF'
  | 'DEPT_AND_CHILD_OR_SELF'

/** 后端 RoleDataScopeDTO：部门 id 为字符串（雪花 long 防精度丢失） */
export interface RoleDataScopeConfig {
  roleCode: string
  dataScope: RoleDataScope
  departmentIds: string[]
}

/** 数据权限保存输入；departmentIds 仅在 CUSTOM 时生效 */
export interface RoleDataScopeInput {
  dataScope: RoleDataScope
  departmentIds?: string[]
}

/** 分页查询角色（keyword 同时匹配编码/名称；status 为空不过滤） */
export function fetchRoles(params: {
  page: number
  size: number
  keyword?: string
  roleCode?: string
  roleName?: string
  status?: RoleStatus
}) {
  return get<PageResult<Role>>('/roles', params)
}

/** 创建角色（roleCode 唯一，创建后不可改） */
export function createRole(input: RoleCreateInput) {
  return post<Role>('/roles', input)
}

/** 按代理 id 更新角色（名称、描述、启用状态） */
export function updateRole(id: string, input: RoleUpdateInput) {
  return put<Role>(`/roles/${id}`, input)
}

/** 批量删除角色；单事务执行，任一目标不存在则整体失败，并级联清理全部关联 */
export function deleteRoles(ids: string[]) {
  return del<void>('/roles', { roleIds: ids })
}

/** 查询某角色已分配的用户列表 */
export function fetchRoleUsers(id: string) {
  return get<User[]>(`/roles/${id}/users`)
}

/** 全量替换某角色的用户分配；传空数组表示清空 */
export function assignRoleUsers(id: string, userIds: string[]) {
  return put<void>(`/roles/${id}/users`, { userIds })
}

/** 查询某角色已授权的菜单 id 列表 */
export function fetchRoleMenus(id: string) {
  return get<string[]>(`/roles/${id}/menus`)
}

/** 查询角色的数据权限配置（自定义类型时含部门 id 列表） */
export function fetchRoleDataScope(id: string) {
  return get<RoleDataScopeConfig>(`/roles/${id}/data-scope`)
}

/** 保存角色的数据权限配置；非 CUSTOM 类型后端会清空自定义部门 */
export function assignRoleDataScope(id: string, input: RoleDataScopeInput) {
  return put<void>(`/roles/${id}/data-scope`, input)
}

/** 全量替换某角色的菜单授权（菜单代理 id）；传空数组表示清空 */
export function assignRoleMenus(id: string, menuIds: string[]) {
  return put<void>(`/roles/${id}/menus`, { menuIds })
}
