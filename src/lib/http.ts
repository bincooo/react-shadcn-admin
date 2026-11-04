import ky, { HTTPError, type KyInstance } from 'ky'
import { useAuthStore } from '@/store/auth'
import type { QueryParamValue } from '@/types'

/** 接口前缀，可用 .env 的 VITE_API_BASE 覆盖 */
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

/** 统一的接口错误：带上 HTTP 状态码，便于调用方区分 401 / 404 等 */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** 从错误响应体里取后端给的 message，取不到就用状态文本 */
function messageFrom(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

interface MockApiError {
  status: number
  message: string
}

/**
 * fake 接口用 200 + `__fakeApiError` 表达业务失败（生产 mock 无法动态改状态码），
 * 这里统一转成 ApiError，业务代码无需感知 mock 与真实后端的差异。
 */
function readMockApiError(value: unknown): MockApiError | undefined {
  if (!value || typeof value !== 'object' || !('__fakeApiError' in value)) {
    return undefined
  }
  const raw = (value as { __fakeApiError?: unknown }).__fakeApiError
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('status' in raw) ||
    !('message' in raw)
  ) {
    return undefined
  }
  const { status, message } = raw as { status?: unknown; message?: unknown }
  return typeof status === 'number' && typeof message === 'string'
    ? { status, message }
    : undefined
}

/** 解包响应体：mock 错误信封优先转成 ApiError */
function unwrap<T>(value: unknown): T {
  const error = readMockApiError(value)
  if (error) throw new ApiError(error.message, error.status)
  return value as T
}

/**
 * 全局 ky 实例：
 *   - prefix 统一拼 /api
 *   - beforeRequest 注入 Bearer token
 *   - beforeError 把 ky 的 HTTPError 归一成 ApiError，并在 401 时清空登录态
 *   - retry 关闭：重试策略交给 TanStack Query，避免两层重试叠加
 */
const api: KyInstance = ky.create({
  prefix: API_BASE,
  timeout: 15_000,
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = useAuthStore.getState().token
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    beforeError: [
      ({ error }) => {
        if (!(error instanceof HTTPError)) return error
        const status = error.response.status
        if (status === 401) useAuthStore.getState().logout()
        return new ApiError(
          messageFrom(error.data, error.response.statusText),
          status,
        )
      },
    ],
  },
})

/** 查询参数：跳过 undefined / null / 空串，其余转成字符串 */
function toSearchParams(
  params?: Record<string, QueryParamValue>,
): Record<string, string> | undefined {
  if (!params) return undefined
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  if (!entries.length) return undefined
  return Object.fromEntries(entries.map(([k, v]) => [k, String(v)]))
}

/** 空响应体（204 / 205）没有 JSON 可解析，按 void 返回 */
function readJson(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return Promise.resolve(undefined)
  }
  return response.json()
}

/** GET */
export function get<T>(
  path: string,
  params?: Record<string, QueryParamValue>,
): Promise<T> {
  return api
    .get(path, { searchParams: toSearchParams(params) })
    .then((res) => readJson(res))
    .then((data) => unwrap<T>(data))
}

/** POST JSON */
export function post<T>(path: string, body?: unknown): Promise<T> {
  return api
    .post(path, body === undefined ? undefined : { json: body })
    .then((res) => readJson(res))
    .then((data) => unwrap<T>(data))
}

/** PUT JSON */
export function put<T>(path: string, body?: unknown): Promise<T> {
  return api
    .put(path, body === undefined ? undefined : { json: body })
    .then((res) => readJson(res))
    .then((data) => unwrap<T>(data))
}

/** DELETE（空响应体按 void 返回） */
export function del<T>(path: string): Promise<T> {
  return api
    .delete(path)
    .then((res) => readJson(res))
    .then((data) => unwrap<T>(data))
}
