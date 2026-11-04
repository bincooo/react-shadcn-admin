import { get } from '@/lib/http'

/**
 * 当前登录用户档案：对应后端 `GET /api/auth/getUserInfo` 的 `data` 字段。
 * 未填写的资料项为 null，由页面统一按「未填写」占位。
 */
export interface ProfileData {
  userId: string
  username: string
  /** 展示名：昵称，未填写时回退用户名 */
  userName: string
  avatar: string | null
  sex: string | null
  signature: string | null
  email: string | null
  phone: string | null
  roles: string[]
  job: string | null
  /** 已废弃的自由文本部门（后端恒为 null）；展示请看 deptName */
  dept: string | null
  /** 绑定部门 ID（雪花 ID 以字符串传输），null 表示未绑定 */
  deptId: string | null
  /** 绑定部门名称，未绑定或部门已删除时为 null */
  deptName: string | null
  enabled: boolean
  /** 注册时间（UTC 瞬时值，ISO-8601） */
  registerTime: string | null
}

/** 当前登录用户档案；后端统一信封，取 data 字段 */
export async function fetchProfile(): Promise<ProfileData> {
  const response = await get<{ data: ProfileData }>('/auth/getUserInfo')
  return response.data
}
