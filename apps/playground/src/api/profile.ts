import { get, put } from '@/lib/http'

/**
 * 当前登录用户档案：对应后端 `GET /api/auth/getUserInfo` 的 `data` 字段。
 * 未填写的资料项缺省，由页面统一按「未填写」占位。
 */
export interface ProfileData {
  userId: string
  username: string
  /** 展示名：昵称，未填写时回退用户名 */
  userName: string
  avatar?: string
  sex?: string
  signature?: string
  email?: string
  phone?: string
  roles: string[]
  job?: string
  /** 已废弃的自由文本部门（后端恒为空）；展示请看 deptName */
  dept?: string
  /** 绑定部门 ID（雪花 ID 以字符串传输），缺省表示未绑定 */
  deptId?: string
  /** 绑定部门名称，未绑定或部门已删除时缺省 */
  deptName?: string
  enabled: boolean
  /** 注册时间（UTC 瞬时值，ISO-8601） */
  registerTime?: string
}

/** 当前登录用户可自行修改的档案字段（账号 / 角色 / 部门不可改） */
export interface ProfileUpdateInput {
  userName: string
  avatar?: string
  sex?: string
  signature?: string
  email?: string
  phone?: string
  job?: string
}

/** 当前登录用户档案；后端统一信封，取 data 字段 */
export async function fetchProfile(): Promise<ProfileData> {
  const response = await get<{ data: ProfileData }>('/auth/getUserInfo')
  return response.data
}

/** 保存当前登录用户档案，返回更新后的完整资料 */
export async function updateProfile(
  input: ProfileUpdateInput,
): Promise<ProfileData> {
  const response = await put<{ data: ProfileData }>('/auth/profile', input)
  return response.data
}
