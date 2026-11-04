import { del, get, post, put } from '@/lib/http'

/** 菜单类型：目录（不绑页面）/ 可访问页面 / 权限按钮 */
export type SystemMenuType = 'DIRECTORY' | 'MENU' | 'BUTTON'

/** 菜单启用状态 */
export type SystemMenuStatus = 'ENABLED' | 'DISABLED'

/** 后端 MenuDTO：树节点；叶子节点 children 为空（接口返回空数组，表格渲染前归一为 undefined） */
export interface SystemMenu {
  menuCode: string
  /** 空串表示根节点 */
  parentMenuCode: string
  /** 展示名；兼容 i18n 词条 key（缺失时前端原样显示） */
  menuName: string
  menuType: SystemMenuType
  menuUrl: string | null
  /** 前端图标映射表里的 Lucide 图标名 */
  imageIcon: string | null
  seq: number
  status: SystemMenuStatus
  createdAt: string
  createdBy: string | null
  children?: SystemMenu[]
}

/** 创建 / 编辑菜单表单输入；status 创建与编辑均生效，缺省为启用 */
export interface SystemMenuInput {
  menuCode: string
  parentMenuCode?: string
  menuName: string
  menuType: SystemMenuType
  menuUrl?: string
  imageIcon?: string
  seq: number
  status?: SystemMenuStatus
}

/** 查询菜单管理树（全量类型与状态，与侧边导航的 /menus 契约不同） */
export function fetchSystemMenuTree() {
  return get<SystemMenu[]>('/menus/tree')
}

/** 创建菜单（后端恒定为启用状态） */
export function createSystemMenu(input: SystemMenuInput) {
  return post<SystemMenu>('/menus', input)
}

/** 更新菜单（menuCode 不可改；status 省略表示不变更） */
export function updateSystemMenu(menuCode: string, input: SystemMenuInput) {
  return put<SystemMenu>(`/menus/${menuCode}`, input)
}

/** 删除菜单；cascade 为 true 时递归删除全部子菜单并清理角色授权 */
export function deleteSystemMenu(menuCode: string, cascade: boolean) {
  return del<void>(`/menus/${menuCode}?cascade=${cascade}`)
}
