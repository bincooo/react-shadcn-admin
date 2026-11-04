import type {
  SystemRole,
  SystemRoleCreateInput,
  SystemRoleDataScope,
  SystemRoleDataScopeInput,
  SystemRoleUpdateInput,
} from '@/api/system/role'
import type { FakeRouteConfig } from 'vite-plugin-fake-server/client'
import {
  mockError,
  mockState,
  paginate,
  queryString,
  removeRole,
  roleUsers,
  setRoleUsers,
} from '../../mock-state'

const ROLE_CODE_PATTERN = /^[A-Za-z0-9:_-]{2,64}$/

const DATA_SCOPES: SystemRoleDataScope[] = [
  'ALL',
  'CUSTOM',
  'DEPT',
  'DEPT_AND_CHILD',
  'SELF',
  'DEPT_AND_CHILD_OR_SELF',
]

function findRole(roleCode: string): SystemRole | undefined {
  return mockState.roles.find((role) => role.roleCode === roleCode)
}

/** 角色编码可能出现在路径里，客户端会 encode；path-to-regexp 已解码 */
function roleCodeFrom(params: Record<string, string | string[]>): string {
  return queryString(params.roleCode)
}

const routes = [
  {
    url: '/api/roles',
    method: 'GET',
    response: ({ query }) => {
      const keyword = queryString(query.keyword).trim().toLocaleLowerCase()
      const roles = mockState.roles.filter(
        (role) =>
          !keyword ||
          role.roleCode.toLocaleLowerCase().includes(keyword) ||
          role.roleName.toLocaleLowerCase().includes(keyword),
      )
      return paginate(roles, query.page, query.size)
    },
  },
  {
    url: '/api/roles',
    method: 'POST',
    response: ({ body }) => {
      const input = body as unknown as SystemRoleCreateInput
      const roleCode = input.roleCode?.trim() ?? ''
      const roleName = input.roleName?.trim() ?? ''
      if (!ROLE_CODE_PATTERN.test(roleCode)) {
        return mockError(400, '角色编码格式无效')
      }
      if (roleName.length === 0 || roleName.length > 128) {
        return mockError(400, '角色名称需为 1~128 位')
      }
      if (findRole(roleCode)) return mockError(409, '角色编码已存在')

      const role: SystemRole = {
        roleCode,
        roleName,
        description: input.description?.trim() || null,
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
    url: '/api/roles/:roleCode',
    method: 'PUT',
    response: ({ params, body }) => {
      const role = findRole(roleCodeFrom(params))
      if (!role) return mockError(404, '角色不存在')

      const input = body as unknown as SystemRoleUpdateInput
      if (input.roleName !== undefined) {
        role.roleName = input.roleName.trim() || role.roleName
      }
      if (input.description !== undefined) {
        role.description = input.description.trim() || null
      }
      if (input.status) role.status = input.status
      return role
    },
  },
  {
    url: '/api/roles/:roleCode',
    method: 'DELETE',
    response: ({ params }) => {
      const roleCode = roleCodeFrom(params)
      if (!findRole(roleCode)) return mockError(404, '角色不存在')
      removeRole(roleCode)
      return { success: true }
    },
  },
  {
    url: '/api/roles/:roleCode/users',
    method: 'GET',
    response: ({ params }) => {
      const roleCode = roleCodeFrom(params)
      if (!findRole(roleCode)) return mockError(404, '角色不存在')
      const ids = new Set(roleUsers()[roleCode] ?? [])
      return mockState.users.filter((user) => ids.has(user.id))
    },
  },
  {
    url: '/api/roles/:roleCode/users',
    method: 'PUT',
    response: ({ params, body }) => {
      const roleCode = roleCodeFrom(params)
      if (!findRole(roleCode)) return mockError(404, '角色不存在')
      const userIds = Array.isArray(body.userIds)
        ? body.userIds.map((id) => String(id))
        : []
      setRoleUsers(roleCode, userIds)
      return { success: true }
    },
  },
  {
    url: '/api/roles/:roleCode/menus',
    method: 'GET',
    response: ({ params }) => {
      const roleCode = roleCodeFrom(params)
      if (!findRole(roleCode)) return mockError(404, '角色不存在')
      return mockState.roleMenus[roleCode] ?? []
    },
  },
  {
    url: '/api/roles/:roleCode/menus',
    method: 'PUT',
    response: ({ params, body }) => {
      const roleCode = roleCodeFrom(params)
      if (!findRole(roleCode)) return mockError(404, '角色不存在')
      mockState.roleMenus[roleCode] = Array.isArray(body.menuCodes)
        ? body.menuCodes.map((code) => String(code))
        : []
      return { success: true }
    },
  },
  {
    url: '/api/roles/:roleCode/data-scope',
    method: 'GET',
    response: ({ params }) => {
      const roleCode = roleCodeFrom(params)
      if (!findRole(roleCode)) return mockError(404, '角色不存在')
      return (
        mockState.roleDataScope[roleCode] ?? {
          roleCode,
          dataScope: 'ALL',
          departmentIds: [],
        }
      )
    },
  },
  {
    url: '/api/roles/:roleCode/data-scope',
    method: 'PUT',
    response: ({ params, body }) => {
      const roleCode = roleCodeFrom(params)
      if (!findRole(roleCode)) return mockError(404, '角色不存在')

      const input = body as unknown as SystemRoleDataScopeInput
      if (!DATA_SCOPES.includes(input.dataScope)) {
        return mockError(400, '数据权限类型无效')
      }
      const custom = input.dataScope === 'CUSTOM'
      mockState.roleDataScope[roleCode] = {
        roleCode,
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
