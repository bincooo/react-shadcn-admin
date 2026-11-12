import { del, get, post, put } from '@/lib/http'
import type { PageResult } from '@/types'
import type { Demo, DemoInput } from './types'

/** 分页查询演示；keyword 由后端按可查询字段模糊匹配 */
export function fetchDemoPage(params: {
  page: number
  size: number
  keyword?: string
}) {
  return get<PageResult<Demo>>('/demo', params)
}

/** 按 ID 查询演示详情 */
export function fetchDemo(id: string) {
  return get<Demo>(`/demo/${id}`)
}

/** 创建演示 */
export function createDemo(input: DemoInput) {
  return post<Demo>('/demo', input)
}

/** 更新演示 */
export function updateDemo(id: string, input: DemoInput) {
  return put<Demo>(`/demo/${id}`, input)
}

/** 删除演示 */
export function deleteDemo(id: string) {
  return del<void>(`/demo/${id}`)
}
