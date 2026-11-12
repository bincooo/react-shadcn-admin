import type { FakeRouteConfig } from 'vite-plugin-fake-server/client'
import {
  currentAccount,
  issueToken,
  mockError,
  mockState,
  nextSnowflakeId,
  profileFor,
  roleNamesOf,
} from '../../mock-state'

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

const routes = [
  {
    url: '/api/auth/login',
    method: 'POST',
    response: ({ body }) => {
      const username = String(body.username ?? '').trim()
      const password = String(body.password ?? '')
      const account = mockState.accounts.find(
        (candidate) =>
          candidate.username.toLocaleLowerCase() ===
            username.toLocaleLowerCase() && candidate.password === password,
      )
      if (!account) return mockError(401, '用户名或密码错误')

      return {
        token: issueToken(account.id),
        user: {
          id: account.id,
          name: account.name,
          email: account.email,
          avatar: account.avatar,
          role: account.role,
        },
      }
    },
  },
  {
    url: '/api/auth/register',
    method: 'POST',
    response: ({ body }) => {
      const username = String(body.username ?? '').trim()
      const email = String(body.email ?? '').trim()
      const password = String(body.password ?? '')
      if (
        username.length < 3 ||
        username.length > 32 ||
        !EMAIL_PATTERN.test(email) ||
        password.length < 8
      ) {
        return mockError(400, '用户名、邮箱或密码格式无效')
      }

      const duplicate =
        mockState.accounts.some(
          (account) =>
            account.username.toLocaleLowerCase() ===
              username.toLocaleLowerCase() ||
            account.email.toLocaleLowerCase() === email.toLocaleLowerCase(),
        ) ||
        mockState.users.some(
          (user) =>
            user.username.toLocaleLowerCase() ===
              username.toLocaleLowerCase() ||
            (user.email?.toLocaleLowerCase() ?? '') ===
              email.toLocaleLowerCase(),
        )
      if (duplicate) return mockError(409, '用户名或邮箱已注册')

      const id = nextSnowflakeId()
      const registerTime = new Date().toISOString()
      mockState.users.unshift({
        id,
        username,
        nickname: username,
        avatar: undefined,
        email,
        phone: undefined,
        signature: undefined,
        sex: undefined,
        job: undefined,
        deptId: undefined,
        deptName: undefined,
        roles: ['common'],
        roleNames: roleNamesOf(['common']),
        enabled: true,
        registerTime,
      })
      mockState.accounts.push({
        id,
        username,
        password,
        name: username,
        email,
        avatar: '',
        role: '普通用户',
        permissions: [],
      })

      return { id, username, email, message: '注册成功' }
    },
  },
  {
    url: '/api/auth/getUserInfo',
    method: 'GET',
    response: ({ headers }) => ({ data: profileFor(currentAccount(headers)) }),
  },
  {
    url: '/api/auth/profile',
    method: 'PUT',
    response: ({ headers, body }) => {
      const account = currentAccount(headers)
      const user = mockState.users.find(
        (candidate) => candidate.id === account.id,
      )
      if (!user) return mockError(404, '用户不存在')

      const email = String(body.email ?? '').trim()
      if (email && !EMAIL_PATTERN.test(email)) {
        return mockError(400, '邮箱格式无效')
      }

      const text = (value: unknown) => {
        const next = String(value ?? '').trim()
        return next || undefined
      }
      user.nickname = text(body.userName) ?? user.username
      user.avatar = text(body.avatar)
      user.sex = text(body.sex)
      user.signature = text(body.signature)
      user.email = text(body.email)
      user.phone = text(body.phone)
      user.job = text(body.job)

      account.name = user.nickname ?? user.username
      account.email = user.email ?? account.email
      account.avatar = user.avatar ?? ''
      return { data: profileFor(account) }
    },
  },
  {
    url: '/api/auth/permissions',
    method: 'GET',
    response: ({ headers }) => ({
      data: currentAccount(headers).permissions,
    }),
  },
] satisfies FakeRouteConfig

export default routes
