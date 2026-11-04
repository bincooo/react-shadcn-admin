/**
 * Mock 运行时状态：模块级内存数据 + 请求处理共用的纯函数。
 * dev server 重启后回到种子状态；接口写入立即生效。
 */
import type { PageResult } from '@/types'
import type { ProfileData } from '@/api/profile'
import type { SystemDeptTreeNode } from '@/api/system/dept'
import type { SystemMenu } from '@/api/system/menu'
import type { SystemRoleDataScopeConfig } from '@/api/system/role'
import { authAccountSeeds, type MockAccount } from './fixtures/auth'
import { deptSeeds } from './fixtures/depts'
import { menuSeeds } from './fixtures/menus'
import { roleDataScopeSeeds, roleMenuSeeds, roleSeeds } from './fixtures/roles'
import { userSeeds } from './fixtures/users'

/** mock 错误响应体：`__fakeApiError` 由 vite-plugin-fake-server 转成 HTTP 状态码 */
interface MockApiErrorBody {
  message: string
  __fakeApiError: { status: number; message: string }
}

/** 侧边导航接口的节点结构 */
interface NavMenuNode {
  key: string
  path: string
  label: string
  icon: string
  children?: NavMenuNode[]
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const mockState = {
  accounts: clone(authAccountSeeds),
  users: clone(userSeeds),
  roles: clone(roleSeeds),
  depts: clone(deptSeeds),
  menus: clone(menuSeeds),
  roleMenus: clone(roleMenuSeeds) as Record<string, string[]>,
  roleDataScope: clone(roleDataScopeSeeds) as Record<
    string,
    SystemRoleDataScopeConfig
  >,
}

/* ------------------------------- 请求参数 ------------------------------- */

export function queryString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

function queryNumber(
  value: string | string[] | undefined,
  fallback: number,
): number {
  const parsed = Number(queryString(value))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** 'true' / 'false'；空值返回 undefined（表示不过滤） */
export function queryBoolean(
  value: string | string[] | undefined,
): boolean | undefined {
  const raw = queryString(value)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

export function paginate<T>(
  items: T[],
  pageValue: string | string[] | undefined,
  sizeValue: string | string[] | undefined,
): PageResult<T> {
  const page = Math.floor(queryNumber(pageValue, 1))
  const size = Math.floor(queryNumber(sizeValue, 10))
  const start = (page - 1) * size
  return {
    records: items.slice(start, start + size),
    total: items.length,
    page,
    size,
    totalPages: Math.ceil(items.length / size),
  }
}

/** 统一错误信封：客户端 lib/http 会解析并抛 ApiError */
export function mockError(status: number, message: string): MockApiErrorBody {
  return { message, __fakeApiError: { status, message } }
}

/* --------------------------------- 认证 --------------------------------- */

const TOKEN_PREFIX = 'mock-token'

export function issueToken(accountId: string): string {
  return `${TOKEN_PREFIX}:${accountId}:${Date.now()}`
}

/** 从 Authorization 头解析当前账号；无效 token 回退到第一个账号 */
export function currentAccount(
  headers: Record<string, string | string[] | undefined>,
): MockAccount {
  const raw = headers.authorization
  const authorization = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
  const match = /^Bearer mock-token:([^:]+):/.exec(authorization)
  const id = match?.[1]
  return (
    mockState.accounts.find((account) => account.id === id) ??
    mockState.accounts[0]
  )
}

export function profileFor(account: MockAccount): ProfileData {
  const user = mockState.users.find((candidate) => candidate.id === account.id)
  return {
    userId: account.id,
    username: account.username,
    userName: user?.nickname ?? account.name,
    avatar: account.avatar || null,
    sex: user?.sex ?? null,
    signature: user?.signature ?? null,
    email: user?.email ?? account.email,
    phone: user?.phone ?? null,
    roles: user?.roles ?? [],
    job: user?.job ?? null,
    dept: null,
    deptId: user?.deptId ?? null,
    deptName: user?.deptName ?? null,
    enabled: user?.enabled ?? true,
    registerTime: user?.registerTime ?? null,
  }
}

/* --------------------------------- 菜单 --------------------------------- */

function toNavNode(node: SystemMenu): NavMenuNode | null {
  const children = (node.children ?? [])
    .filter((child) => child.menuType !== 'BUTTON')
    .sort((left, right) => left.seq - right.seq)
    .map(toNavNode)
    .filter((child): child is NavMenuNode => child !== null)

  // 目录没有可见子项时不在导航里留空分组
  if (node.menuType === 'DIRECTORY' && children.length === 0) return null

  const nav: NavMenuNode = {
    key: node.menuCode,
    path: node.menuUrl ?? '',
    label: node.menuName,
    icon: node.imageIcon ?? 'List',
  }
  if (children.length > 0) nav.children = children
  return nav
}

export function navMenus(): NavMenuNode[] {
  return mockState.menus
    .filter((node) => node.status === 'ENABLED')
    .sort((left, right) => left.seq - right.seq)
    .map(toNavNode)
    .filter((node): node is NavMenuNode => node !== null)
}

export function menuTree(): SystemMenu[] {
  return mockState.menus
}

/** 在树中查找节点及其所在层级（根层或某个父节点的 children） */
export function findMenu(
  menuCode: string,
): { node: SystemMenu; siblings: SystemMenu[] } | null {
  function search(
    siblings: SystemMenu[],
  ): { node: SystemMenu; siblings: SystemMenu[] } | null {
    for (const node of siblings) {
      if (node.menuCode === menuCode) return { node, siblings }
      const found = search(node.children ?? [])
      if (found) return found
    }
    return null
  }
  return search(mockState.menus)
}

export function insertMenu(node: SystemMenu) {
  const parent = node.parentMenuCode
    ? findMenu(node.parentMenuCode)?.node
    : undefined
  const siblings = parent ? (parent.children ??= []) : mockState.menus
  siblings.push(node)
  siblings.sort((left, right) => left.seq - right.seq)
}

/** 从树中摘下节点（保留节点及其子树），返回被摘下的节点 */
export function detachMenu(menuCode: string): SystemMenu | null {
  const found = findMenu(menuCode)
  if (!found) return null
  const index = found.siblings.indexOf(found.node)
  if (index >= 0) found.siblings.splice(index, 1)
  return found.node
}

export function removeMenu(menuCode: string, cascade: boolean): boolean {
  const found = findMenu(menuCode)
  if (!found) return false
  if (!cascade && (found.node.children?.length ?? 0) > 0) return false
  const index = found.siblings.indexOf(found.node)
  if (index >= 0) found.siblings.splice(index, 1)
  return true
}

/* --------------------------------- 部门 --------------------------------- */

export function deptTree(): SystemDeptTreeNode[] {
  function build(parentId: string | null): SystemDeptTreeNode[] {
    return mockState.depts
      .filter((dept) => dept.parentId === parentId)
      .sort((left, right) => left.sort - right.sort)
      .map((dept) => {
        const children = build(dept.id)
        return { ...dept, children: children.length > 0 ? children : null }
      })
  }
  return build(null)
}

export function deptName(deptId: string | null | undefined): string | null {
  if (!deptId) return null
  return mockState.depts.find((dept) => dept.id === deptId)?.deptName ?? null
}

/* --------------------------------- 角色 --------------------------------- */

/** 角色 → 用户 id；直接由用户的 roles 派生，避免两份数据漂移 */
export function roleUsers(): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const role of mockState.roles) result[role.roleCode] = []
  for (const user of mockState.users) {
    for (const roleCode of user.roles) {
      const ids = (result[roleCode] ??= [])
      ids.push(user.id)
    }
  }
  return result
}

/** 全量替换某角色的用户分配，并同步每个用户的 roles */
export function setRoleUsers(roleCode: string, userIds: string[]) {
  const target = new Set(userIds)
  for (const user of mockState.users) {
    const hasRole = user.roles.includes(roleCode)
    const shouldHaveRole = target.has(user.id)
    if (shouldHaveRole && !hasRole) user.roles = [...user.roles, roleCode]
    if (!shouldHaveRole && hasRole) {
      user.roles = user.roles.filter((code) => code !== roleCode)
    }
  }
}

/** 删除角色及其菜单授权、数据权限 */
export function removeRole(roleCode: string) {
  mockState.roles = mockState.roles.filter((role) => role.roleCode !== roleCode)
  delete mockState.roleMenus[roleCode]
  delete mockState.roleDataScope[roleCode]
  for (const user of mockState.users) {
    user.roles = user.roles.filter((code) => code !== roleCode)
  }
}

/* --------------------------------- 主键 --------------------------------- */

let idSequence = 0

/** 递增的雪花风格字符串主键（超过 JS 安全整数，仅作字符串展示） */
export function nextSnowflakeId(): string {
  idSequence += 1
  return String(
    1900000000000000000n +
      BigInt(Date.now()) * 1000n +
      BigInt(idSequence % 1000),
  )
}
