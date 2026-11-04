import { del, get, post, put } from '@/lib/http'
import type { PageResult } from '@/types'

/** 后端 UserDTO：雪花 id 已序列化为字符串 */
export interface SystemUser {
  id: string
  username: string
  nickname: string | null
  avatar: string | null
  email: string | null
  phone: string | null
  signature: string | null
  sex: string | null
  job: string | null
  deptId: string | null
  deptName: string | null
  roles: string[]
  enabled: boolean
  registerTime: string
}

/** 创建 / 编辑用户表单输入 */
export interface SystemUserInput {
  username: string
  /** 仅创建时必填（6-64 位），编辑接口忽略 */
  password?: string
  nickname?: string
  avatar?: string
  email?: string
  phone?: string
  signature?: string
  sex?: string
  job?: string
  deptId?: string | null
  roles: string[]
  enabled: boolean
}

/** 分页查询用户（keyword 按账号/昵称/手机号/邮箱模糊匹配；phone 精确匹配；enabled 为空不过滤） */
export function fetchSystemUsers(params: {
  page: number
  size: number
  keyword?: string
  phone?: string
  enabled?: boolean
}) {
  return get<PageResult<SystemUser>>('/users', {
    ...params,
    // 查询参数只接字符串，后端由 Spring 转回 Boolean
    enabled: params.enabled === undefined ? undefined : String(params.enabled),
  })
}

/** 创建用户（roles 至少一个，默认 common） */
export function createSystemUser(input: SystemUserInput) {
  return post<SystemUser>('/users', input)
}

/** 更新用户档案与角色（不含密码） */
export function updateSystemUser(id: string, input: SystemUserInput) {
  return put<SystemUser>(`/users/${id}`, input)
}

/** 重置用户密码（新密码 6-64 位，后端经哈希存储） */
export function resetSystemUserPassword(id: string, password: string) {
  return put<void>(`/users/${id}/password`, { password })
}

/** 删除用户；后端禁止删除当前登录账号 */
export function deleteSystemUser(id: string) {
  return del<void>(`/users/${id}`)
}
