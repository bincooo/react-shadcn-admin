import { del, get, post, put } from '@/lib/http'
import type { PageResult } from '@/types'

/** 后端 UserDTO：雪花 id 已序列化为字符串 */
export interface User {
  id: string
  username: string
  nickname?: string
  avatar?: string
  email?: string
  phone?: string
  signature?: string
  sex?: string
  job?: string
  deptId?: string
  deptName?: string
  roles: string[]
  /** 后端按角色表翻译的名称，与 roles 同序；未知角色回退为编码 */
  roleNames: string[]
  enabled: boolean
  registerTime: string
}

/** 创建 / 编辑用户表单输入 */
export interface UserInput {
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
  deptId?: string
  roles: string[]
  enabled: boolean
}

/** 分页查询用户（keyword 按账号/昵称/手机号/邮箱模糊匹配；phone 精确匹配；enabled 为空不过滤） */
export function fetchUsers(params: {
  page: number
  size: number
  keyword?: string
  phone?: string
  enabled?: boolean
}) {
  return get<PageResult<User>>('/users', {
    ...params,
    // 查询参数只接字符串，后端由 Spring 转回 Boolean
    enabled: params.enabled === undefined ? undefined : String(params.enabled),
  })
}

/** 创建用户（roles 至少一个，默认 common） */
export function createUser(input: UserInput) {
  return post<User>('/users', input)
}

/** 更新用户档案与角色（不含密码） */
export function updateUser(id: string, input: UserInput) {
  return put<User>(`/users/${id}`, input)
}

/** 重置用户密码（新密码 6-64 位，后端经哈希存储） */
export function resetUserPassword(id: string, password: string) {
  return put<void>(`/users/${id}/password`, { password })
}

/** 批量删除用户；单事务执行，任一目标不存在或含当前登录账号则整体失败 */
export function deleteUsers(ids: string[]) {
  return del<void>('/users', { userIds: ids })
}
