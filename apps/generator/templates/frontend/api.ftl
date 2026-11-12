import { del, get, post, put } from '@/lib/http'
import type { PageResult } from '@/types'
import type { ${entity}, ${entity}Input } from './types'

/** 分页查询${displayName}；keyword 由后端按可查询字段模糊匹配 */
export function fetch${entity}Page(params: {
  page: number
  size: number
  keyword?: string
}) {
  return get<PageResult<${entity}>>('/${route}', params)
}

/** 按 ID 查询${displayName}详情 */
export function fetch${entity}(id: string) {
  return get<${entity}>(`/${route}/\${id}`)
}

/** 创建${displayName} */
export function create${entity}(input: ${entity}Input) {
  return post<${entity}>('/${route}', input)
}

/** 更新${displayName} */
export function update${entity}(id: string, input: ${entity}Input) {
  return put<${entity}>(`/${route}/\${id}`, input)
}

/** 删除${displayName} */
export function delete${entity}(id: string) {
  return del<void>(`/${route}/\${id}`)
}
