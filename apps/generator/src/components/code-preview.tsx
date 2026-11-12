import { useEffect, useMemo, useState } from 'react'
import {
  CheckIcon,
  CopyIcon,
  FileCode2Icon,
  FileTextIcon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@repo/ui/components/button'
import type { GenerateResult } from '@/types'
import { Badge, EmptyState, Section, TextInput } from '@/components/ui'
import { DIALECT_LABELS } from '@/lib/catalog'
import { detectLanguage, languageLabel, tokenize } from '@/lib/highlight'
import { cn } from '@repo/ui/lib/utils'

const GROUP_ORDER = [
  'ddd-domain',
  'ddd-application',
  'ddd-infrastructure',
  'ddd-interfaces',
  'frontend',
  'generator',
]

function groupOf(path: string) {
  return path.split('/')[0]
}

function fileLabel(path: string) {
  return path.split('/').slice(-2).join('/')
}

/** 分组排序：已知分组按 GROUP_ORDER 排在前面，未知分组统一排到末尾。 */
function groupRank(group: string) {
  const index = GROUP_ORDER.indexOf(group)
  return index === -1 ? GROUP_ORDER.length : index
}

export function CodePreview({
  result,
  loading,
  stale,
  onRefresh,
}: {
  result: GenerateResult | null
  loading: boolean
  stale: boolean
  onRefresh: () => void
}) {
  const [query, setQuery] = useState('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const files = result?.files ?? {}
  const paths = useMemo(() => Object.keys(files), [files])

  useEffect(() => {
    if (paths.length === 0) {
      setSelectedPath(null)
      return
    }
    if (!selectedPath || !files[selectedPath]) {
      setSelectedPath(paths.find((path) => path.endsWith('.java')) ?? paths[0])
    }
  }, [paths, files, selectedPath])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return keyword
      ? paths.filter((path) => path.toLowerCase().includes(keyword))
      : paths
  }, [paths, query])

  const grouped = useMemo(() => {
    const groups = new Map<string, string[]>()
    for (const path of filtered) {
      const group = groupOf(path)
      const list = groups.get(group) ?? []
      list.push(path)
      groups.set(group, list)
    }
    return [...groups.entries()].sort(
      ([left], [right]) => groupRank(left) - groupRank(right),
    )
  }, [filtered])

  const selectedContent = selectedPath ? files[selectedPath] : undefined
  const language = detectLanguage(selectedPath)
  const tokens = useMemo(
    () => tokenize(selectedContent ?? '', language),
    [selectedContent, language],
  )
  const lineCount = selectedContent ? selectedContent.split('\n').length : 0

  const copy = async () => {
    if (!selectedContent) return
    try {
      await navigator.clipboard.writeText(selectedContent)
      setCopied(true)
      toast.success('已复制当前文件')
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('浏览器拒绝写入剪贴板')
    }
  }

  return (
    <Section
      title="代码预览"
      description={
        result
          ? `${result.summary.fileCount} 个文件 · ${result.summary.detailCount} 个明细表 · ${result.summary.dialects
              .map((dialect) => DIALECT_LABELS[dialect])
              .join(' / ')}`
          : '根据当前表定义实时生成，不会写入磁盘。'
      }
      action={
        <div className="flex items-center gap-2">
          {stale ? <Badge tone="warning">未保存的改动</Badge> : null}
          <Button
            size="xs"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCwIcon
              data-icon="inline-start"
              className={loading ? 'animate-spin' : undefined}
            />
            刷新预览
          </Button>
        </div>
      }
    >
      {!result && !loading ? (
        <EmptyState
          title="还没有生成结果"
          description="点击右上角「刷新预览」用当前表定义生成一次，文件会在这里按模块分组显示。"
          action={
            <Button size="sm" onClick={onRefresh}>
              生成预览
            </Button>
          }
        />
      ) : null}

      {loading && !result ? (
        <div className="grid min-h-48 place-items-center text-xs text-muted-foreground">
          正在生成…
        </div>
      ) : null}

      {result ? (
        <div className="grid gap-2 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col rounded-xl border border-border">
            <div className="relative border-b border-border p-1.5">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-3 -translate-y-1/2 text-muted-foreground" />
              <TextInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="过滤文件路径"
                className="h-7 pl-6 text-[10px]"
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-1 lg:max-h-[calc(100dvh-290px)]">
              {grouped.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">
                  没有匹配文件。
                </p>
              ) : (
                grouped.map(([group, groupPaths]) => (
                  <div key={group} className="mb-2">
                    <p className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {group}
                    </p>
                    <ul>
                      {groupPaths.map((path) => {
                        const name = fileLabel(path)
                        const active = path === selectedPath
                        const isSql = path.endsWith('.sql')
                        return (
                          <li key={path}>
                            <button
                              type="button"
                              onClick={() => setSelectedPath(path)}
                              title={path}
                              className={cn(
                                'flex w-full items-center gap-1 px-1.5 py-1 text-left font-mono text-[12px]',
                                active
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-muted/70',
                              )}
                            >
                              {isSql ? (
                                <FileTextIcon className="size-3 shrink-0" />
                              ) : (
                                <FileCode2Icon className="size-3 shrink-0" />
                              )}
                              <span className="truncate">{name}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between gap-1.5 border-b border-border px-2 py-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 bg-muted px-1 py-0 font-mono text-[12px] font-medium text-muted-foreground">
                  {languageLabel(language)}
                </span>
                <p className="min-w-0 truncate font-mono text-[12px] text-muted-foreground">
                  {selectedPath ?? '选择文件'}
                </p>
                {selectedContent ? (
                  <span className="shrink-0 text-[12px] text-muted-foreground">
                    {lineCount} 行
                  </span>
                ) : null}
              </div>
              <Button
                size="xs"
                variant="ghost"
                onClick={copy}
                disabled={!selectedContent}
              >
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            <pre className="code-scroll code-surface max-h-[calc(100dvh-290px)] min-h-48 overflow-auto p-2 text-[12px] leading-relaxed">
              <code>
                {tokens.map((token, index) =>
                  token.type === 'plain' ? (
                    <span key={index}>{token.text}</span>
                  ) : (
                    <span key={index} className={`tok-${token.type}`}>
                      {token.text}
                    </span>
                  ),
                )}
              </code>
            </pre>
          </div>
        </div>
      ) : null}
    </Section>
  )
}
