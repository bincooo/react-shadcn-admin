import type {
  AppConfig,
  GenerateResult,
  TableDefinition,
  TableListResult,
  WriteResult,
} from '@/types'

const API_BASE = '/api'

export class ApiError extends Error {
  status: number
  issues: string[]

  constructor(message: string, status: number, issues: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.issues = issues
  }
}

async function readError(response: Response): Promise<never> {
  let payload: { error?: string; detail?: string; issues?: string[] } = {}
  try {
    payload = await response.json()
  } catch {
    // 非 JSON 错误响应，使用状态文本
  }
  throw new ApiError(
    payload.detail || payload.error || response.statusText || '请求失败',
    response.status,
    payload.issues ?? [],
  )
}

async function requestApi(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) return readError(response)
  return response
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestApi(path, init)
  return (await response.json()) as T
}

function encodeName(name: string) {
  return encodeURIComponent(name)
}

function filenameFrom(header: string | null, fallback: string) {
  if (!header) return fallback
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8) return decodeURIComponent(utf8[1])
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1] ?? fallback
}

async function requestZip(definition: TableDefinition) {
  const response = await requestApi('/generate', {
    method: 'POST',
    body: JSON.stringify({ definition }),
  })
  const blob = await response.blob()
  return {
    blob,
    filename: filenameFrom(
      response.headers.get('content-disposition'),
      `${definition.entityName}-ddd.zip`,
    ),
  }
}

export const api = {
  config: () => request<AppConfig>('/config'),

  listTables: () => request<TableListResult>('/tables'),

  getTable: (name: string) =>
    request<{ definition: TableDefinition }>(
      `/tables/${encodeName(name)}`,
    ).then((result) => result.definition),

  saveTable: (definition: TableDefinition, originalName?: string) =>
    request<{ definition: TableDefinition }>('/tables', {
      method: 'POST',
      body: JSON.stringify({ definition, originalName }),
    }).then((result) => result.definition),

  deleteTable: (name: string) =>
    request<{ ok: boolean; name: string }>(`/tables/${encodeName(name)}`, {
      method: 'DELETE',
    }),

  preview: (definition: TableDefinition) =>
    request<GenerateResult>('/preview', {
      method: 'POST',
      body: JSON.stringify({ definition }),
    }),

  generateZip: requestZip,

  write: (definition: TableDefinition, directory?: string) =>
    request<WriteResult>('/write', {
      method: 'POST',
      body: JSON.stringify({ definition, directory }),
    }),
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
