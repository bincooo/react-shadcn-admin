import { useMemo, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Tree } from '@/components/core/tree'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/** 树形选择节点；children 为空表示叶子，disabled 节点可见但不可选 */
export interface TreeSelectNode {
  id: string
  label: string
  disabled?: boolean
  children?: TreeSelectNode[] | null
}

interface TreeSelectProps {
  nodes: TreeSelectNode[]
  /** 选中节点 id；null 表示未选择（对应 nullLabel 项） */
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
  /** 提供顶部「空值」项文案；不传则没有空值项 */
  nullLabel?: string
  ariaLabel?: string
  /** 关联外部 Label 的 htmlFor */
  id?: string
  disabled?: boolean
  className?: string
}

/** 按 id 在树中查找节点（含禁用节点，用于回显） */
function findNode(nodes: TreeSelectNode[], id: string): TreeSelectNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * 单值树形选择器：Popover 触发器 + 通用树（默认全展开）。
 *
 * 通用树负责层级与连接线，这里只渲染单选内容：名称按钮 + 选中对勾；
 * 禁用节点保留在树中用于展示既有绑定，但不能被选中。
 */
export function TreeSelect({
  nodes,
  value,
  onChange,
  placeholder,
  nullLabel,
  ariaLabel,
  id,
  disabled,
  className,
}: TreeSelectProps) {
  const { t } = useTranslation()
  const [openState, setOpen] = useState(false)

  const selectedLabel = useMemo(() => {
    if (value === null) return nullLabel ?? null
    return findNode(nodes, value)?.label ?? null
  }, [nodes, value, nullLabel])

  const select = (nextValue: string | null) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <Popover open={openState} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={openState}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span
            className={cn(
              'truncate',
              selectedLabel === null && 'text-muted-foreground',
            )}
          >
            {selectedLabel ?? placeholder ?? t('common.pleaseSelect')}
          </span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-64 w-[var(--radix-popover-trigger-width)] overflow-y-auto p-1"
      >
        <Tree
          nodes={nodes}
          getKey={(node) => node.id}
          getChildren={(node) => node.children}
          getLabel={(node) => node.label}
          isDisabled={(node) => !!node.disabled}
          isSelected={(node) => node.id === value}
          ariaLabel={ariaLabel}
          leading={
            nullLabel !== undefined ? (
              <li role="none">
                <button
                  type="button"
                  role="treeitem"
                  aria-selected={value === null}
                  onClick={() => select(null)}
                  className={cn(
                    'flex w-full items-center gap-1.5 rounded-sm px-1 py-1 text-left text-[13px] transition-colors hover:bg-muted/40',
                    value === null && 'bg-primary/10',
                  )}
                >
                  {/* 与节点名称对齐：节点行有 20px 箭头槽 */}
                  <span className="size-5 shrink-0" />
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate px-1',
                      value === null && 'font-medium text-primary',
                    )}
                  >
                    {nullLabel}
                  </span>
                  {value === null && <Check className="size-3.5 shrink-0" />}
                </button>
              </li>
            ) : undefined
          }
          renderNode={(node) => (
            <button
              type="button"
              role="treeitem"
              aria-selected={node.id === value}
              aria-disabled={node.disabled || undefined}
              disabled={node.disabled}
              onClick={() => select(node.id)}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-0.5 text-left text-[13px]',
                node.disabled && 'cursor-not-allowed',
                node.id === value && 'font-medium text-primary',
              )}
            >
              <span className="min-w-0 flex-1 truncate">{node.label}</span>
              {node.id === value && <Check className="size-3.5 shrink-0" />}
            </button>
          )}
        />
      </PopoverContent>
    </Popover>
  )
}
