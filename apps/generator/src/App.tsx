import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowUpIcon,
  BlocksIcon,
  DownloadIcon,
  FileCode2Icon,
  FolderDownIcon,
  Loader2Icon,
  MoonIcon,
  PlusIcon,
  SaveIcon,
  Settings2Icon,
  SunIcon,
  TablePropertiesIcon,
  Trash2Icon,
  type LucideIcon,
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { Button } from '@repo/ui/components/button'
import { CodePreview } from '@/components/code-preview'
import { ColumnEditor } from '@/components/column-editor'
import { DetailTablesEditor } from '@/components/detail-tables-editor'
import { GenerationForm } from '@/components/generation-form'
import { MetaForm } from '@/components/meta-form'
import { TableSidebar } from '@/components/table-sidebar'
import { Badge, EmptyState } from '@/components/ui'
import { useDraft } from '@/hooks/use-draft'
import { usePreview } from '@/hooks/use-preview'
import { api, downloadBlob } from '@/lib/api'
import { notifyError } from '@/lib/notify'
import { currentTheme, toggleTheme, type ThemeMode } from '@/lib/theme'
import type { AppConfig, TableDefinition, TableSummary } from '@/types'
import { cn } from '@repo/ui/lib/utils'

type TabKey = 'meta' | 'columns' | 'options' | 'preview'
type BusyAction = 'save' | 'zip' | 'write' | 'delete' | null

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'meta', label: '基础信息', icon: TablePropertiesIcon },
  { key: 'columns', label: '字段设计', icon: TablePropertiesIcon },
  { key: 'options', label: '生成配置', icon: Settings2Icon },
  { key: 'preview', label: '代码预览', icon: FileCode2Icon },
]

/** 操作按钮的图标：执行中显示旋转的加载图标，其余时候显示原图标。 */
function ActionIcon({
  busy,
  idle: Idle,
  inline = true,
}: {
  busy: boolean
  idle: LucideIcon
  inline?: boolean
}) {
  const iconProps = { 'data-icon': inline ? 'inline-start' : undefined }
  return busy ? (
    <Loader2Icon {...iconProps} className="animate-spin" />
  ) : (
    <Idle {...iconProps} />
  )
}

function AppHeader({
  theme,
  onToggleTheme,
  onNew,
}: {
  theme: ThemeMode
  onToggleTheme: () => void
  onNew: () => void
}) {
  return (
    <header className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/85 px-2.5 py-1.5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <BlocksIcon className="size-4" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[12px] font-semibold">
            后端代码模板生成器
          </h1>
          <p className="truncate text-[9px] text-muted-foreground">
            Java DDD CRUD · MySQL / PostgreSQL / SQL Server / Oracle
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="切换明暗主题"
          title="切换明暗主题"
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
        <Button size="xs" variant="outline" onClick={onNew}>
          <PlusIcon data-icon="inline-start" />
          新建表
        </Button>
      </div>
    </header>
  )
}

function TabNav({
  tab,
  columnCount,
  onChange,
}: {
  tab: TabKey
  columnCount: number
  onChange: (tab: TabKey) => void
}) {
  return (
    <nav className="scrollbar-none flex gap-0.5 overflow-x-auto border border-border bg-card p-0.5">
      {TABS.map((item) => {
        const Icon = item.icon
        const active = tab === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-3" />
            {item.label}
            {item.key === 'columns' ? (
              <span className="bg-muted px-1 py-0 text-[9px]">
                {columnCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}

function DraftMeta({
  draft,
  dirty,
  loading,
}: {
  draft: TableDefinition
  dirty: boolean
  loading: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <h2 className="truncate text-[15px] font-semibold">
          {draft.displayName || draft.entityName}
        </h2>
        {dirty ? (
          <Badge tone="warning">未保存</Badge>
        ) : (
          <Badge tone="success">已保存</Badge>
        )}
        {loading ? <Badge tone="primary">读取中</Badge> : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
        <span>{draft.name}</span>
        <span>/</span>
        <span>{draft.columns.length} 列</span>
        <span>/</span>
        <span>{draft.detailTables.length} 明细表</span>
        <span>/</span>
        <span>
          {draft.options.outputMode === 'disk' ? '写入工程' : 'ZIP 下载'}
        </span>
      </div>
    </div>
  )
}

function DraftActions({
  busy,
  dirty,
  hasSelection,
  onDownloadZip,
  onWriteToDisk,
  onSave,
  onDelete,
}: {
  busy: BusyAction
  dirty: boolean
  hasSelection: boolean
  onDownloadZip: () => void
  onWriteToDisk: () => void
  onSave: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="xs"
        variant="outline"
        disabled={busy !== null}
        onClick={onDownloadZip}
      >
        <ActionIcon busy={busy === 'zip'} idle={DownloadIcon} />
        ZIP
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={busy !== null}
        onClick={onWriteToDisk}
      >
        <ActionIcon busy={busy === 'write'} idle={FolderDownIcon} />
        写入工程
      </Button>
      <Button size="xs" disabled={busy !== null || !dirty} onClick={onSave}>
        <ActionIcon busy={busy === 'save'} idle={SaveIcon} />
        保存
      </Button>
      {hasSelection ? (
        <Button
          size="xs"
          variant="destructive"
          aria-label="删除表定义"
          title="删除表定义"
          disabled={busy !== null}
          onClick={onDelete}
        >
          <ActionIcon
            busy={busy === 'delete'}
            idle={Trash2Icon}
            inline={false}
          />
        </Button>
      ) : null}
    </div>
  )
}

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [tables, setTables] = useState<TableSummary[]>([])
  const [loadErrors, setLoadErrors] = useState<
    { name: string; error: string }[]
  >([])
  const [query, setQuery] = useState('')
  const [bootLoading, setBootLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('meta')
  const [busy, setBusy] = useState<BusyAction>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => currentTheme())

  const {
    draft,
    selectedName,
    dirty,
    loading: loadingDetail,
    load: loadDraft,
    patch: patchDraft,
    setColumns: patchColumns,
    setDetailTables: patchDetailTables,
    setOptions: patchOptions,
    createNew,
    markSaved,
    clear: clearDraft,
  } = useDraft(tables)
  const {
    result: preview,
    loading: previewLoading,
    stale: previewStale,
    run: runPreview,
    reset: resetPreview,
    markStale: markPreviewStale,
  } = usePreview(draft, tab)

  const refreshList = useCallback(async () => {
    const result = await api.listTables()
    setTables(result.tables)
    setLoadErrors(result.errors)
    return result
  }, [])

  const loadTable = useCallback(
    async (name: string, force = false) => {
      const loaded = await loadDraft(name, force)
      if (loaded) {
        resetPreview()
        setTab('meta')
      }
    },
    [loadDraft, resetPreview],
  )

  useEffect(() => {
    let alive = true
    async function boot() {
      try {
        const [appConfig, list] = await Promise.all([
          api.config(),
          api.listTables(),
        ])
        if (!alive) return
        setConfig(appConfig)
        setTables(list.tables)
        setLoadErrors(list.errors)
        const first = list.tables[0]
        if (first) {
          const definition = await api.getTable(first.name)
          if (!alive) return
          markSaved(definition)
        }
      } catch (error) {
        if (alive) notifyError(error)
      } finally {
        if (alive) setBootLoading(false)
      }
    }
    void boot()
    return () => {
      alive = false
    }
  }, [markSaved])

  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const updateDraft = useCallback(
    (patch: Parameters<typeof patchDraft>[0]) => {
      patchDraft(patch)
      markPreviewStale()
    },
    [patchDraft, markPreviewStale],
  )

  const updateColumns = useCallback(
    (columns: Parameters<typeof patchColumns>[0]) => {
      patchColumns(columns)
      markPreviewStale()
    },
    [patchColumns, markPreviewStale],
  )

  const updateDetailTables = useCallback(
    (detailTables: Parameters<typeof patchDetailTables>[0]) => {
      patchDetailTables(detailTables)
      markPreviewStale()
    },
    [patchDetailTables, markPreviewStale],
  )

  const updateOptions = useCallback(
    (patch: Parameters<typeof patchOptions>[0]) => {
      patchOptions(patch)
      markPreviewStale()
    },
    [patchOptions, markPreviewStale],
  )

  const saveDraft = useCallback(async () => {
    if (!draft || busy) return
    setBusy('save')
    try {
      const saved = await api.saveTable(draft, selectedName ?? undefined)
      markSaved(saved)
      if (preview) markPreviewStale()
      await refreshList()
      toast.success(`已保存 ${saved.name}`, {
        description: `已覆盖写入 data/${saved.name}.jsonl（单条记录）`,
      })
    } catch (error) {
      notifyError(error)
    } finally {
      setBusy(null)
    }
  }, [
    busy,
    draft,
    markPreviewStale,
    markSaved,
    preview,
    refreshList,
    selectedName,
  ])

  const downloadZip = useCallback(async () => {
    if (!draft || busy) return
    setBusy('zip')
    try {
      const { blob, filename } = await api.generateZip(draft)
      downloadBlob(blob, filename)
      toast.success(`已生成 ${filename}`)
    } catch (error) {
      notifyError(error)
    } finally {
      setBusy(null)
    }
  }, [busy, draft])

  const writeToDisk = useCallback(async () => {
    if (!draft || busy) return
    const target = draft.options.outputDirectory
    const frontendTarget = draft.options.frontendDirectory
    const confirmed = window.confirm(
      `即将把生成文件写入：\n后端：${target}\n前端：${frontendTarget}\n\n同名文件会被覆盖（不会删除其他文件）。是否继续？`,
    )
    if (!confirmed) return
    setBusy('write')
    try {
      const result = await api.write(draft)
      const backendCreated = result.created - result.frontendCreated
      const backendUpdated = result.updated - result.frontendUpdated
      const parts = [
        `后端 ${result.targetDirectory} · 新建 ${backendCreated} / 覆盖 ${backendUpdated}`,
      ]
      if (result.frontendTargetDirectory) {
        parts.push(
          `前端 ${result.frontendTargetDirectory} · 新建 ${result.frontendCreated} / 覆盖 ${result.frontendUpdated}`,
        )
      }
      toast.success(`已写入 ${result.count} 个文件`, {
        description: parts.join('；'),
      })
    } catch (error) {
      notifyError(error)
    } finally {
      setBusy(null)
    }
  }, [busy, draft])

  const removeTable = useCallback(async () => {
    if (!selectedName || busy) return
    const confirmed = window.confirm(
      `确定删除表定义 ${selectedName} 吗？\n对应 data/${selectedName}.jsonl 的全部历史版本都会删除，且不可恢复。`,
    )
    if (!confirmed) return
    setBusy('delete')
    try {
      await api.deleteTable(selectedName)
      const result = await refreshList()
      clearDraft()
      resetPreview()
      toast.success(`已删除 ${selectedName}`)
      const next = result.tables[0]
      if (next) await loadTable(next.name, true)
    } catch (error) {
      notifyError(error)
    } finally {
      setBusy(null)
    }
  }, [busy, clearDraft, loadTable, refreshList, resetPreview, selectedName])

  const saveRef = useRef(saveDraft)
  saveRef.current = saveDraft
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleNew = () => {
    createNew()
    resetPreview()
    setTab('meta')
  }

  const handleSelect = (table: TableSummary) => {
    if (table.name === selectedName && !dirty) return
    void loadTable(table.name)
  }

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <AppHeader
        theme={theme}
        onToggleTheme={() => setTheme(toggleTheme())}
        onNew={handleNew}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <TableSidebar
          tables={tables}
          errors={loadErrors}
          selectedName={selectedName}
          query={query}
          loading={bootLoading}
          onQueryChange={setQuery}
          onSelect={handleSelect}
          onNew={handleNew}
        />

        {/* relative：作为滚动容器的定位基准，避免组件内部的 sr-only
            绝对定位元素以 html 为基准逃出 overflow 裁剪、撑出外层滚动条 */}
        <main
          ref={mainRef}
          className="relative min-w-0 flex-1 overflow-y-auto"
          onScroll={(event) =>
            setShowBackToTop(event.currentTarget.scrollTop > 240)
          }
        >
          <div className="mx-auto max-w-[1600px] p-2.5">
            {bootLoading ? (
              <div className="grid min-h-48 place-items-center text-[11px] text-muted-foreground">
                <Loader2Icon className="mb-1.5 size-4 animate-spin" />
                正在读取 data/ 下的表定义…
              </div>
            ) : !draft ? (
              <EmptyState
                title="选择一张表开始设计"
                description="从左侧打开已有表定义，或新建一张表。表定义以 JSONL 快照保存到 apps/generator/data/，也可以直接用 node 指令读取生成。"
                action={
                  <Button size="xs" onClick={handleNew}>
                    <PlusIcon data-icon="inline-start" />
                    新建表
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <DraftMeta
                    draft={draft}
                    dirty={dirty}
                    loading={loadingDetail}
                  />
                  <DraftActions
                    busy={busy}
                    dirty={dirty}
                    hasSelection={Boolean(selectedName)}
                    onDownloadZip={() => void downloadZip()}
                    onWriteToDisk={() => void writeToDisk()}
                    onSave={() => void saveDraft()}
                    onDelete={() => void removeTable()}
                  />
                </div>

                <TabNav
                  tab={tab}
                  columnCount={draft.columns.length}
                  onChange={setTab}
                />

                {tab === 'meta' ? (
                  <MetaForm draft={draft} onChange={updateDraft} />
                ) : null}
                {tab === 'columns' ? (
                  <>
                    <ColumnEditor
                      draft={draft}
                      onColumnsChange={updateColumns}
                    />
                    <DetailTablesEditor
                      draft={draft}
                      onChange={updateDetailTables}
                    />
                  </>
                ) : null}
                {tab === 'options' ? (
                  <GenerationForm
                    draft={draft}
                    config={config}
                    onOptionsChange={updateOptions}
                  />
                ) : null}
                {tab === 'preview' ? (
                  <CodePreview
                    result={preview}
                    loading={previewLoading}
                    stale={previewStale}
                    onRefresh={() => void runPreview()}
                  />
                ) : null}
              </div>
            )}
          </div>
        </main>
      </div>

      <Button
        type="button"
        size="icon-lg"
        variant="outline"
        aria-label="回到顶部"
        title="回到顶部"
        onClick={scrollToTop}
        className={cn(
          'fixed right-4 bottom-4 z-30 shadow-lg transition-all duration-200',
          showBackToTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <ArrowUpIcon />
      </Button>

      <Toaster position="top-center" theme={theme} richColors closeButton />
    </div>
  )
}
