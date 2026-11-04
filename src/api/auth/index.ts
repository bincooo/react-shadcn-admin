import { get, post } from '@/lib/http'

/** 登录成功的凭据：token 供后续请求携带，user 为展示所需的画像字段 */
export interface LoginResult {
  token: string
  user: {
    id: string
    name: string
    email: string
    avatar: string
    role: string
  }
}

export interface RegisterResult {
  id: string
  username: string
  email: string
  message: string
}

/** 账号校验与 token 签发都在后端完成，前端不做本地校验 */
export function loginRequest(username: string, password: string) {
  return post<LoginResult>('/auth/login', { username, password })
}

/** 当前登录用户的按钮权限编码（用于前端操作按钮显隐） */
export async function fetchPermissions(): Promise<string[]> {
  const response = await get<{ data: string[] }>('/auth/permissions')
  return response.data
}

export function registerRequest(
  username: string,
  email: string,
  password: string,
) {
  return post<RegisterResult>('/auth/register', {
    username,
    email,
    password,
  })
}
