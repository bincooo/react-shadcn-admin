import { del, get, post, put } from '@/lib/http'

/** 部门启用状态 */
export type DeptStatus = 'ENABLED' | 'DISABLED'

/** 后端 DeptDTO：雪花 id 已序列化为字符串 */
export interface Dept {
  id: string
  parentId?: string
  deptCode: string
  deptName: string
  sort: number
  status: DeptStatus
  description?: string
  createdAt: string
}

/** 部门树节点：比 Dept 多一层 children，节点信息完整以便表单回显 */
export interface DeptTreeNode {
  id: string
  parentId?: string
  deptCode: string
  deptName: string
  sort: number
  status: DeptStatus
  description?: string
  createdAt: string
  children?: DeptTreeNode[]
}

/** 创建部门表单输入（后端固定新建为启用） */
export interface DeptCreateInput {
  parentId?: string
  deptCode: string
  deptName: string
  sort?: number
  description?: string
}

/** 编辑部门表单输入；status 省略表示不变更 */
export interface DeptUpdateInput {
  deptName: string
  parentId?: string
  sort?: number
  description?: string
  status?: DeptStatus
}

/** 查询部门树（按 sort 升序，children 为空时缺省） */
export function fetchDeptTree() {
  return get<DeptTreeNode[]>('/departments/tree')
}

/** 创建部门（deptCode 唯一，后端固定新建为启用） */
export function createDept(input: DeptCreateInput) {
  return post<Dept>('/departments', input)
}

/** 更新部门（名称、父部门、排序、描述、启用状态） */
export function updateDept(id: string, input: DeptUpdateInput) {
  return put<Dept>(`/departments/${id}`, input)
}

/** 删除部门；后端拒绝删除仍含子部门或在职用户的部门 */
export function deleteDept(id: string) {
  return del<void>(`/departments/${id}`)
}
