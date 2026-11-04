import type { FakeRouteConfig } from 'vite-plugin-fake-server/client'
import {
  currentAccount,
  issueToken,
  mockError,
  mockState,
  nextSnowflakeId,
  profileFor,
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
        avatar: null,
        email,
        phone: null,
        signature: null,
        sex: null,
        job: null,
        deptId: null,
        deptName: null,
        roles: ['common'],
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
    url: '/api/auth/permissions',
    method: 'GET',
    response: ({ headers }) => ({
      data: currentAccount(headers).permissions,
    }),
  },
] satisfies FakeRouteConfig

export default routes
