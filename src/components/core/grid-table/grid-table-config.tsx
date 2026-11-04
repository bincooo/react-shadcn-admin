import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  GripVertical,
  Pencil,
  Pin,
  RotateCcw,
  SquarePlus,
  Ungroup,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { collectLeafKeys } from './column-config'
import type {
  ColumnConfigSnapshot,
  ConfigGroup,
  ConfigItem,
  ConfigItemRef,
} from './column-config'
import { useGridTableConfigEditor } from './use-grid-table-config-editor'

/* ------------------------------ 小组件 ------------------------------ */

/** 行内图标按钮：默认次要色，激活时主色 */
function RowIconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'shrink-0 text-muted-foreground/60 hover:text-foreground',
        active && 'text-primary hover:text-primary',
      )}
    >
      {children}
    </Button>
  )
}

/* ------------------------------ 列配置面板 ------------------------------ */

export interface GridTableConfigProps {
  /** 打开面板时的列结构 / 显隐 / 固定快照 */
  initial: ColumnConfigSnapshot
  /** 「恢复默认」使用的初始快照 */
  defaults: ColumnConfigSnapshot
  /** 叶子列 id → 展示名称 */
  leafLabels: Record<string, string>
  /** 默认分组 id → 展示名称（来自传入的 columns） */
  groupLabels: Record<string, string>
  onCancel: () => void
  onApply: (next: ColumnConfigSnapshot) => void
}

const ROW_CLASS = 'group/row flex h-8 items-center gap-1.5 px-1.5'

/** 拖到分组上：整行浅色底；边框仍是那条虚线，只换颜色 */
const DROP_INTO_CLASS = 'bg-primary/10'

/** 拖叶子列时，所有分组显示灰色虚线提示可放入；进入某个分组后才换成主题色 */
const DROP_GROUP_CLASS = 'outline outline-1 outline-dashed'
const DROP_GROUP_IDLE_COLOR = 'outline-muted-foreground/40'
const DROP_GROUP_ACTIVE_COLOR = 'outline-primary'

/** 插到某一项之前：行顶部主色插入线 + 整行浅色底，明确当前落点 */
const DROP_BEFORE_CLASS =
  'relative bg-primary/5 before:pointer-events-none before:absolute before:inset-x-0 before:-top-0.5 before:z-10 before:h-0.5 before:rounded-full before:bg-primary'
/** 插到某一项之后：行底部主色插入线（因此可以拖到列表 / 分组末尾） */
const DROP_AFTER_CLASS =
  'relative bg-primary/5 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-0.5 after:z-10 after:h-0.5 after:rounded-full after:bg-primary'
/** 拖拽中：行变淡，作为“正在移动”的提示 */
const DRAGGING_CLASS = 'opacity-40'

/**
 * 列配置面板：草稿式编辑（取消 / 确认），支持分组、拖拽排序与跨层移动，
 * 分组可以任意嵌套（分组行上半 = 插到分组前，下半 = 移入分组；
 * 不能放进自己 / 自己的后代），支持重命名与拆解分组、整体左右固定。
 */
export function GridTableConfig({
  initial,
  defaults,
  leafLabels,
  groupLabels,
  onCancel,
  onApply,
}: GridTableConfigProps) {
  const { t } = useTranslation()

  const {
    itemsState,
    visibilityState,
    collapsedState,
    editingIdState,
    editingNameState,
    setEditingName,
    dragSourceState,
    scrollRef,
    allVisible,
    someVisible,
    setVisibility,
    dropState,
    applyDropTarget,
    dropInvalid,
    cancelRename,
    handleRenameBlur,
    trackAutoScroll,
    stopAutoScroll,
    handleDragStart,
    handleDragEnd,
    handleTopDragOver,
    handleTopDrop,
    handleChildDragOver,
    handleChildDrop,
    handleEdgeDragOver,
    handleEdgeDrop,
    isPinned,
    togglePin,
    groupLabel,
    toggleCollapse,
    startRename,
    finishRename,
    ungroup,
    resetDraft,
    addGroup,
    setAllVisible,
    apply,
  } = useGridTableConfigEditor({
    initial,
    defaults,
    leafLabels,
    groupLabels,
    onApply,
  })

  /* ------------------------------ 渲染 ------------------------------ */

  const renderGrip = (source: ConfigItemRef) => (
    <button
      type="button"
      draggable
      aria-label={t('table.dragHint')}
      title={t('table.dragHint')}
      onDragStart={(event) => handleDragStart(event, source)}
      onDragEnd={handleDragEnd}
      className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/50 transition-colors group-hover/row:text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
    >
      <GripVertical className="size-3.5" />
    </button>
  )

  const renderPins = (ids: string[]) => (
    <>
      <RowIconButton
        label={t('table.pinLeft')}
        active={isPinned(ids, 'start')}
        onClick={() => togglePin(ids, 'start')}
      >
        <Pin className="size-3.5" />
      </RowIconButton>
      <RowIconButton
        label={t('table.pinRight')}
        active={isPinned(ids, 'end')}
        onClick={() => togglePin(ids, 'end')}
      >
        <Pin className="size-3.5 -scale-x-100" />
      </RowIconButton>
    </>
  )

  const renderLeaf = (leafId: string, groupId: string | null) => {
    const targetKey = groupId ? `child:${groupId}:${leafId}` : `top:${leafId}`
    const leaf: ConfigItem = { kind: 'leaf', id: leafId }
    const { before: showBefore, after: showAfter } = dropState(targetKey)
    const isDragging =
      dragSourceState?.kind === 'leaf' && dragSourceState.id === leafId
    return (
      <div
        key={targetKey}
        className={cn(
          ROW_CLASS,
          showBefore && DROP_BEFORE_CLASS,
          showAfter && DROP_AFTER_CLASS,
          isDragging && DRAGGING_CLASS,
        )}
        onDragOver={(event) =>
          groupId
            ? handleChildDragOver(event, groupId, leafId)
            : handleTopDragOver(event, leaf)
        }
        onDrop={(event) =>
          groupId
            ? handleChildDrop(event, groupId, leafId)
            : handleTopDrop(event, leaf)
        }
      >
        {renderGrip({ kind: 'leaf', id: leafId })}
        <Checkbox
          checked={visibilityState[leafId] ?? true}
          aria-label={leafLabels[leafId] ?? leafId}
          onCheckedChange={(checked) =>
            setVisibility((prev) => ({
              ...prev,
              [leafId]: checked === true,
            }))
          }
        />
        <span className="truncate text-[13px]">
          {leafLabels[leafId] ?? leafId}
        </span>
        <span className="flex-1" />
        {renderPins([leafId])}
      </div>
    )
  }

  /** 分组行 + 可折叠的子项区（子项可以是叶子或嵌套分组），任意深度递归 */
  const renderGroup = (item: ConfigGroup) => {
    const isCollapsed = collapsedState.has(item.id)
    const targetKey = `top:${item.id}`
    const {
      before: showBefore,
      after: showAfter,
      into: showInto,
    } = dropState(targetKey)
    const isDragging =
      dragSourceState?.kind === 'group' && dragSourceState.id === item.id
    // 拖拽时分组描虚线提示可放入；自己 / 自己的后代不接受放入
    const isDroppableGroup =
      dragSourceState !== null && !dropInvalid(dragSourceState, item)
    return (
      <div key={item.id}>
        <div
          className={cn(
            ROW_CLASS,
            isDroppableGroup && DROP_GROUP_CLASS,
            isDroppableGroup &&
              (showInto ? DROP_GROUP_ACTIVE_COLOR : DROP_GROUP_IDLE_COLOR),
            showBefore && DROP_BEFORE_CLASS,
            showAfter && DROP_AFTER_CLASS,
            showInto && DROP_INTO_CLASS,
            isDragging && DRAGGING_CLASS,
          )}
          onDragOver={(event) => handleTopDragOver(event, item)}
          onDrop={(event) => handleTopDrop(event, item)}
        >
          {renderGrip({ kind: 'group', id: item.id })}
          <button
            type="button"
            aria-label={
              isCollapsed ? t('table.expandGroup') : t('table.collapseGroup')
            }
            aria-expanded={!isCollapsed}
            onClick={() => toggleCollapse(item.id)}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
          <Folder className="size-3.5 shrink-0 text-muted-foreground" />
          {editingIdState === item.id ? (
            <Input
              autoFocus
              value={editingNameState}
              onChange={(event) => setEditingName(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={handleRenameBlur}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  finishRename(true)
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelRename()
                  event.currentTarget.blur()
                }
              }}
              className="flex-1 rounded-none focus-visible:ring-0"
            />
          ) : (
            <>
              <span className="truncate text-[13px]">{groupLabel(item)}</span>
              <span className="shrink-0 rounded bg-muted px-1 text-[10.5px] leading-4 text-muted-foreground tabular-nums">
                {collectLeafKeys(item.children).length}
              </span>
              <span className="flex-1" />
              <RowIconButton
                label={t('table.renameGroup')}
                onClick={() => startRename(item)}
              >
                <Pencil className="size-3.5" />
              </RowIconButton>
              <RowIconButton
                label={t('table.ungroup')}
                onClick={() => ungroup(item.id)}
              >
                <Ungroup className="size-3.5" />
              </RowIconButton>
              {renderPins(
                item.children
                  .filter((child) => child.kind === 'leaf')
                  .map((child) => child.id),
              )}
            </>
          )}
        </div>

        {/* 缩进 + 竖向引导线，让组内成员与上一层一眼可分 */}
        {!isCollapsed && item.children.length > 0 && (
          <div className="ml-5 border-l border-border pl-2">
            {item.children.map((child) =>
              child.kind === 'group'
                ? renderGroup(child)
                : renderLeaf(child.id, item.id),
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex max-h-[70vh] w-83 flex-col">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2.5">
        <span className="text-[13px] font-semibold">
          {t('table.columnConfig')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={resetDraft}
        >
          <RotateCcw className="size-3.5" />
          {t('table.resetDefault')}
        </Button>
      </div>

      {dragSourceState && (
        <div className="pointer-events-none absolute inset-x-0 top-13 z-20 flex justify-center">
          <span className="bg-popover px-3 py-1 text-[11.5px] text-muted-foreground shadow-md ring-1 ring-foreground/10">
            {t('table.dragHint')}
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto px-2 py-1.5"
        onDragOver={(event) => {
          trackAutoScroll(event.clientY)
          // 行内处理器没有 preventDefault 说明指针不在可放置行上（全部 / 分隔线 / 空白），
          // 清掉落点，避免把上一行的插入线留在界面上
          if (!event.defaultPrevented) applyDropTarget(null)
        }}
        onDragLeave={(event) => {
          if (
            event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            return
          }
          applyDropTarget(null)
          stopAutoScroll()
        }}
      >
        {/* 顶部整块（全部 + 分隔线）都是「插到最前」的落点 */}
        <div
          className="pb-1"
          onDragOver={(event) => handleEdgeDragOver(event, 'head')}
          onDrop={(event) => handleEdgeDrop(event, 'head')}
        >
          <label className="flex h-8 w-16 cursor-pointer items-center gap-2 rounded-md px-1.5 hover:bg-accent">
            <Checkbox
              checked={
                allVisible ? true : someVisible ? 'indeterminate' : false
              }
              onCheckedChange={(checked) => setAllVisible(checked === true)}
            />
            <span className="text-[13px]">{t('table.all')}</span>
          </label>
          <div className="my-1.5 border-t border-border/60" />
        </div>

        {itemsState.map((item) =>
          item.kind === 'group' ? renderGroup(item) : renderLeaf(item.id, null),
        )}

        {/* 底部整块留白是「插到最后」的落点（与顶部「插到最前」对称） */}
        <div
          className="h-5"
          onDragOver={(event) => handleEdgeDragOver(event, 'foot')}
          onDrop={(event) => handleEdgeDrop(event, 'foot')}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border/70 px-3 py-2">
        <Button variant="outline" size="sm" onClick={addGroup}>
          <SquarePlus className="size-3.5" />
          {t('table.newGroup')}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={apply}>
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
