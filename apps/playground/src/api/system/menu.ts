import { del, get, post, put } from '@/lib/http'

/** 菜单类型：目录（不绑页面）/ 可访问页面 / 权限按钮 */
export type MenuType = 'DIRECTORY' | 'MENU' | 'BUTTON'

/** 菜单启用状态 */
export type MenuStatus = 'ENABLED' | 'DISABLED'

/** 后端 MenuDTO：id 是雪花代理主键（字符串），menuCode 是唯一业务键与权限点 */
export interface Menu {
  id: string
  menuCode: string
  /** 父级菜单 id；缺省表示根节点 */
  parentMenuId?: string
  /** 展示名；兼容 i18n 词条 key（缺失时前端原样显示） */
  menuName: string
  menuType: MenuType
  menuUrl?: string
  /** 前端图标映射表里的 Lucide 图标名 */
  imageIcon?: string
  seq: number
  status: MenuStatus
  createdAt: string
  createdBy?: string
  children?: Menu[]
}

/** 创建 / 编辑菜单表单输入；status 创建与编辑均生效，缺省为启用 */
export interface MenuInput {
  menuCode: string
  /** 父级菜单 id；省略表示根节点 */
  parentMenuId?: string
  menuName: string
  menuType: MenuType
  menuUrl?: string
  imageIcon?: string
  seq: number
  status?: MenuStatus
}

/** 查询菜单管理树（全量类型与状态，与侧边导航的 /menus 契约不同） */
export function fetchMenuTree() {
  return get<Menu[]>('/menus/tree')
}

/** 创建菜单（后端恒定为启用状态） */
export function createMenu(input: MenuInput) {
  return post<Menu>('/menus', input)
}

/** 更新菜单（按代理 id；menuCode 不可改；status 省略表示不变更） */
export function updateMenu(id: string, input: MenuInput) {
  return put<Menu>(`/menus/${id}`, input)
}

/** 删除菜单；cascade 为 true 时递归删除全部子菜单并清理角色授权 */
export function deleteMenu(id: string, cascade: boolean) {
  return del<void>(`/menus/${id}?cascade=${cascade}`)
}

/** 批量删除菜单；单事务执行，未级联时任一目标存在子菜单则整体失败 */
export function deleteMenus(ids: string[], cascade: boolean) {
  return del<void>('/menus', { menuIds: ids, cascade })
}
