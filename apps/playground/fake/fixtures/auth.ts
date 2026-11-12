import { adminPermissionCodes } from './roles'
import { userSeeds } from './users'

export interface MockAccount {
  id: string
  username: string
  password: string
  name: string
  email: string
  avatar: string
  /** 侧边栏底部展示的角色名 */
  role: string
  /** 按钮权限编码；空数组表示只读 */
  permissions: string[]
}

/** 登录账号：admin 拥有全部按钮权限，demo 只读 */
export const authAccountSeeds: MockAccount[] = [
  {
    id: userSeeds[0].id,
    username: 'admin',
    password: '123456',
    name: '林晚舟',
    email: 'admin@example.com',
    avatar: '',
    role: '超级管理员',
    permissions: adminPermissionCodes,
  },
  {
    id: userSeeds[1].id,
    username: 'demo',
    password: '123456',
    name: '演示账号',
    email: 'demo@example.com',
    avatar: '',
    role: '普通用户',
    permissions: [],
  },
]
