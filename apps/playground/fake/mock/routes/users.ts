import type { User, UserInput } from '@/api/system/user'
import type { FakeRouteConfig } from 'vite-plugin-fake-server/client'
import {
  currentAccount,
  deptName,
  mockError,
  mockState,
  nextSnowflakeId,
  paginate,
  queryBoolean,
  queryString,
  roleNamesOf,
} from '../../mock-state'

/** 账号 / 昵称 / 手机号 / 邮箱的模糊匹配 */
function matchesKeyword(user: User, keyword: string): boolean {
  if (!keyword) return true
  return [user.username, user.nickname, user.phone, user.email].some((value) =>
    (value ?? '').toLocaleLowerCase().includes(keyword),
  )
}

function findUser(id: string): User | undefined {
  return mockState.users.find((user) => user.id === id)
}

const routes = [
  {
    url: '/api/users',
    method: 'GET',
    response: ({ query }) => {
      const keyword = queryString(query.keyword).trim().toLocaleLowerCase()
      const phone = queryString(query.phone).trim()
      const enabled = queryBoolean(query.enabled)
      const users = mockState.users.filter(
        (user) =>
          matchesKeyword(user, keyword) &&
          (!phone || user.phone === phone) &&
          (enabled === undefined || user.enabled === enabled),
      )
      return paginate(users, query.page, query.size)
    },
  },
  {
    url: '/api/users',
    method: 'POST',
    response: ({ body }) => {
      const input = body as unknown as UserInput
      const username = input.username?.trim()
      if (!username) return mockError(400, '账号不能为空')
      if (!input.password || input.password.length < 6) {
        return mockError(400, '密码至少 6 位')
      }
      if (
        mockState.users.some(
          (user) =>
            user.username.toLocaleLowerCase() === username.toLowerCase(),
        )
      ) {
        return mockError(409, '账号已存在')
      }

      const user: User = {
        id: nextSnowflakeId(),
        username,
        nickname: input.nickname?.trim() || undefined,
        avatar: input.avatar ?? undefined,
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        signature: input.signature ?? undefined,
        sex: input.sex ?? undefined,
        job: input.job ?? undefined,
        deptId: input.deptId ?? undefined,
        deptName: deptName(input.deptId),
        roles: input.roles ?? [],
        roleNames: roleNamesOf(input.roles ?? []),
        enabled: input.enabled ?? true,
        registerTime: new Date().toISOString(),
      }
      mockState.users.unshift(user)
      // 新建用户同时获得登录账号，便于用它验证权限与个人中心
      mockState.accounts.push({
        id: user.id,
        username,
        password: input.password ?? '',
        name: user.nickname ?? username,
        email: user.email ?? '',
        avatar: '',
        role: user.roles.includes('admin') ? '超级管理员' : '普通用户',
        permissions: [],
      })
      return user
    },
  },
  {
    url: '/api/users/:id',
    method: 'PUT',
    response: ({ params, body }) => {
      const id = queryString(params.id)
      const user = findUser(id)
      if (!user) return mockError(404, '用户不存在')

      const input = body as unknown as UserInput
      if (input.nickname !== undefined) {
        user.nickname = input.nickname || undefined
      }
      if (input.avatar !== undefined) user.avatar = input.avatar || undefined
      if (input.email !== undefined) user.email = input.email || undefined
      if (input.phone !== undefined) user.phone = input.phone || undefined
      if (input.signature !== undefined) {
        user.signature = input.signature || undefined
      }
      if (input.sex !== undefined) user.sex = input.sex || undefined
      if (input.job !== undefined) user.job = input.job || undefined
      user.deptId = input.deptId ?? undefined
      user.deptName = deptName(input.deptId)
      if (input.roles) user.roles = input.roles
      user.roleNames = roleNamesOf(user.roles)
      if (typeof input.enabled === 'boolean') user.enabled = input.enabled

      const account = mockState.accounts.find(
        (candidate) => candidate.id === id,
      )
      if (account) {
        account.name = user.nickname ?? user.username
        account.email = user.email ?? account.email
        account.role = user.roles.includes('admin') ? '超级管理员' : '普通用户'
      }
      return user
    },
  },
  {
    url: '/api/users',
    method: 'DELETE',
    response: ({ body, headers }) => {
      const userIds = Array.isArray(body.userIds)
        ? body.userIds.map((id: unknown) => String(id))
        : []
      const unique = [...new Set(userIds)]
      if (unique.length === 0) return mockError(400, 'userIds 不能为空')
      if (unique.includes(currentAccount(headers).id)) {
        return mockError(409, '不能删除当前登录账号')
      }
      if (unique.some((id) => !findUser(id)))
        return mockError(404, '用户不存在')

      mockState.users = mockState.users.filter(
        (user) => !unique.includes(user.id),
      )
      mockState.accounts = mockState.accounts.filter(
        (account) => !unique.includes(account.id),
      )
      return { success: true }
    },
  },
  {
    url: '/api/users/:id',
    method: 'DELETE',
    response: ({ params, headers }) => {
      const id = queryString(params.id)
      if (id === currentAccount(headers).id) {
        return mockError(409, '不能删除当前登录账号')
      }
      const index = mockState.users.findIndex((user) => user.id === id)
      if (index < 0) return mockError(404, '用户不存在')

      mockState.users.splice(index, 1)
      mockState.accounts = mockState.accounts.filter(
        (account) => account.id !== id,
      )
      return { success: true }
    },
  },
  {
    url: '/api/users/:id/password',
    method: 'PUT',
    response: ({ params, body }) => {
      const id = queryString(params.id)
      const password = String(body.password ?? '')
      if (password.length < 6) return mockError(400, '密码至少 6 位')
      if (!findUser(id)) return mockError(404, '用户不存在')

      const account = mockState.accounts.find(
        (candidate) => candidate.id === id,
      )
      if (account) account.password = password
      return { success: true }
    },
  },
] satisfies FakeRouteConfig

export default routes
