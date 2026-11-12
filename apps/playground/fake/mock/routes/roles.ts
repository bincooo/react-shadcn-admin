import type {
  Role,
  RoleCreateInput,
  RoleDataScope,
  RoleDataScopeInput,
  RoleUpdateInput,
} from '@/api/system/role'
import type { FakeRouteConfig } from 'vite-plugin-fake-server/client'
import {
  findMenu,
  findMenuById,
  mockError,
  mockState,
  nextSnowflakeId,
  paginate,
  queryString,
  removeRole,
  roleUsers,
  setRoleUsers,
} from '../../mock-state'

const ROLE_CODE_PATTERN = /^[A-Za-z0-9:_-]{2,64}$/

const DATA_SCOPES: RoleDataScope[] = [
  'ALL',
  'CUSTOM',
  'DEPT',
  'DEPT_AND_CHILD',
  'SELF',
  'DEPT_AND_CHILD_OR_SELF',
]

function findRoleById(id: string): Role | undefined {
  return mockState.roles.find((role) => role.id === id)
}

/** 代理 id 在路径里，path-to-regexp 已解码 */
function roleIdFrom(params: Record<string, string | string[]>): string {
  return queryString(params.id)
}

/** 菜单编码 → 代理 id */
function menuIdOfCode(menuCode: string): string | null {
  return findMenu(menuCode)?.node.id ?? null
}

/** 菜单代理 id → 编码 */
function menuCodeOfId(menuId: string): string | null {
  return findMenuById(menuId)?.node.menuCode ?? null
}

const routes = [
  {
    url: '/api/roles',
    method: 'GET',
    response: ({ query }) => {
      const keyword = queryString(query.keyword).trim().toLocaleLowerCase()
      const roleCode = queryString(query.roleCode).trim().toLocaleLowerCase()
      const roleName = queryString(query.roleName).trim().toLocaleLowerCase()
      const status = queryString(query.status).trim()
      const roles = mockState.roles.filter(
        (role) =>
          (!keyword ||
            role.roleCode.toLocaleLowerCase().includes(keyword) ||
            role.roleName.toLocaleLowerCase().includes(keyword)) &&
          (!roleCode || role.roleCode.toLocaleLowerCase().includes(roleCode)) &&
          (!roleName || role.roleName.toLocaleLowerCase().includes(roleName)) &&
          (!status || role.status === status),
      )
      return paginate(roles, query.page, query.size)
    },
  },
  {
    url: '/api/roles',
    method: 'POST',
    response: ({ body }) => {
      const input = body as unknown as RoleCreateInput
      const roleCode = input.roleCode?.trim() ?? ''
      const roleName = input.roleName?.trim() ?? ''
      if (!ROLE_CODE_PATTERN.test(roleCode)) {
        return mockError(400, '角色编码格式无效')
      }
      if (roleName.length === 0 || roleName.length > 128) {
        return mockError(400, '角色名称需为 1~128 位')
      }
      if (mockState.roles.some((role) => role.roleCode === roleCode)) {
        return mockError(409, '角色编码已存在')
      }

      const role: Role = {
        id: nextSnowflakeId(),
        roleCode,
        roleName,
        description: input.description?.trim() || undefined,
        status: 'ENABLED',
        createdAt: new Date().toISOString(),
      }
      mockState.roles.push(role)
      mockState.roleMenus[roleCode] = []
      mockState.roleDataScope[roleCode] = {
        roleCode,
        dataScope: 'ALL',
        departmentIds: [],
      }
      return role
    },
  },
  {
    url: '/api/roles/:id',
    method: 'PUT',
    response: ({ params, body }) => {
      const role = findRoleById(roleIdFrom(params))
      if (!role) return mockError(404, '角色不存在')

      const input = body as unknown as RoleUpdateInput
      if (input.roleName !== undefined) {
        role.roleName = input.roleName.trim() || role.roleName
      }
      if (input.description !== undefined) {
        role.description = input.description.trim() || undefined
      }
      if (input.status) role.status = input.status
      return role
    },
  },
  {
    url: '/api/roles',
    method: 'DELETE',
    response: ({ body }) => {
      const roleIds = Array.isArray(body.roleIds)
        ? body.roleIds.map((id: unknown) => String(id))
        : []
      const unique = [...new Set(roleIds)]
      if (unique.length === 0) return mockError(400, 'roleIds 不能为空')
      if (unique.some((id) => !findRoleById(id))) {
        return mockError(404, '角色不存在')
      }
      for (const id of unique) {
        const role = findRoleById(id)
        if (role) removeRole(role.roleCode)
      }
      return { success: true }
    },
  },
  {
    url: '/api/roles/:id',
    method: 'DELETE',
    response: ({ params }) => {
      const role = findRoleById(roleIdFrom(params))
      if (!role) return mockError(404, '角色不存在')
      removeRole(role.roleCode)
      return { success: true }
    },
  },
  {
    url: '/api/roles/:id/users',
    method: 'GET',
    response: ({ params }) => {
      const role = findRoleById(roleIdFrom(params))
      if (!role) return mockError(404, '角色不存在')
      const ids = new Set(roleUsers()[role.roleCode] ?? [])
      return mockState.users.filter((user) => ids.has(user.id))
    },
  },
  {
    url: '/api/roles/:id/users',
    method: 'PUT',
    response: ({ params, body }) => {
      const role = findRoleById(roleIdFrom(params))
      if (!role) return mockError(404, '角色不存在')
      const userIds = Array.isArray(body.userIds)
        ? body.userIds.map((id) => String(id))
        : []
      setRoleUsers(role.roleCode, userIds)
      return { success: true }
    },
  },
  {
    url: '/api/roles/:id/menus',
    method: 'GET',
    response: ({ params }) => {
      const role = findRoleById(roleIdFrom(params))
      if (!role) return mockError(404, '角色不存在')
      return (mockState.roleMenus[role.roleCode] ?? [])
        .map(menuIdOfCode)
        .filter((id): id is string => id !== null)
    },
  },
  {
    url: '/api/roles/:id/menus',
    method: 'PUT',
    response: ({ params, body }) => {
      const role = findRoleById(roleIdFrom(params))
      if (!role) return mockError(404, '角色不存在')
      const menuIds = Array.isArray(body.menuIds)
        ? body.menuIds.map((id) => String(id))
        : []
      const menuCodes: string[] = []
      for (const menuId of menuIds) {
        const code = menuCodeOfId(menuId)
        if (!code) return mockError(404, '菜单不存在')
        menuCodes.push(code)
      }
      // 内部沿用业务编码存储，权限点与角色授权保持一致
      mockState.roleMenus[role.roleCode] = menuCodes
      return { success: true }
    },
  },
  {
    url: '/api/roles/:id/data-scope',
    method: 'GET',
    response: ({ params }) => {
      const role = findRoleById(roleIdFrom(params))
      if (!role) return mockError(404, '角色不存在')
      return (
        mockState.roleDataScope[role.roleCode] ?? {
          roleCode: role.roleCode,
          dataScope: 'ALL',
          departmentIds: [],
        }
      )
    },
  },
  {
    url: '/api/roles/:id/data-scope',
    method: 'PUT',
    response: ({ params, body }) => {
      const role = findRoleById(roleIdFrom(params))
      if (!role) return mockError(404, '角色不存在')

      const input = body as unknown as RoleDataScopeInput
      if (!DATA_SCOPES.includes(input.dataScope)) {
        return mockError(400, '数据权限类型无效')
      }
      const custom = input.dataScope === 'CUSTOM'
      mockState.roleDataScope[role.roleCode] = {
        roleCode: role.roleCode,
        dataScope: input.dataScope,
        departmentIds: custom
          ? (input.departmentIds ?? []).map((id) => String(id))
          : [],
      }
      return { success: true }
    },
  },
] satisfies FakeRouteConfig

export default routes
