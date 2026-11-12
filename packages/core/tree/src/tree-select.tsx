import { useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'
import { Spinner } from '@repo/ui/components/spinner'
import { cn } from '@repo/ui/lib/utils'
import { TreeRoot } from './tree'
import { collectAllExpandableKeys, fillFieldNames, mapTree } from './tree-utils'
import type {
  BasicDataNode,
  TreeDataNode,
  TreeKey,
  TreeSelectProps,
} from './types'

function resolveSelectFieldNames(fieldNames?: TreeSelectProps['fieldNames']) {
  return {
    label: fieldNames?.label ?? fieldNames?.title ?? 'label',
    value: fieldNames?.value ?? fieldNames?.key ?? 'value',
    children: fieldNames?.children ?? 'children',
    disabled: fieldNames?.disabled ?? 'disabled',
  }
}

function findNodeLabel<T extends BasicDataNode>(
  nodes: readonly T[],
  targetValue: TreeKey,
  valueKey: string,
  labelKey: string,
  childrenKey: string,
): ReactNode | null {
  for (const node of nodes) {
    const nodeVal = (node[valueKey] ?? node.key ?? node.id) as
      | TreeKey
      | undefined
    if (nodeVal === targetValue) {
      return (node[labelKey] ?? node.title ?? String(nodeVal)) as ReactNode
    }
    const children = node[childrenKey] as readonly T[] | null | undefined
    if (children && children.length > 0) {
      const hit = findNodeLabel(
        children,
        targetValue,
        valueKey,
        labelKey,
        childrenKey,
      )
      if (hit !== null) return hit
    }
  }
  return null
}

export function TreeSelect<T extends BasicDataNode = TreeDataNode>({
  treeData = [],
  fieldNames,
  value: controlledValue,
  defaultValue = null,
  onChange,
  placeholder,
  nullLabel,
  allowClear = false,
  showSearch = false,
  searchPlaceholder = 'Search...',
  treeDefaultExpandAll = false,
  treeDefaultExpandedKeys,
  treeExpandedKeys,
  onTreeExpand,
  treeLine = false,
  treeIcon = false,
  treeCheckable = false,
  multiple = false,
  disabled = false,
  loading = false,
  notFoundContent,
  id,
  ariaLabel,
  className,
  popupClassName,
  filterTreeNode,
}: TreeSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [innerValue, setInnerValue] = useState<TreeKey | TreeKey[] | null>(
    defaultValue,
  )

  const isMulti = multiple || treeCheckable
  const activeValue =
    controlledValue !== undefined ? controlledValue : innerValue
  const resolved = useMemo(
    () => resolveSelectFieldNames(fieldNames),
    [fieldNames],
  )

  const treeFieldNames = useMemo(
    () => ({
      key: resolved.value,
      title: resolved.label,
      children: resolved.children,
      disabled: resolved.disabled,
    }),
    [resolved],
  )

  const normalizedTreeData = useMemo(() => {
    const attachNormalized = (nodes: readonly T[]): T[] =>
      nodes.map((node) => {
        const children = node[resolved.children] as
          | readonly T[]
          | null
          | undefined
        const val = node[resolved.value] ?? node.key ?? node.id
        const lbl = node[resolved.label] ?? node.title ?? String(val ?? '')
        return {
          ...node,
          [resolved.value]: val,
          [resolved.label]: lbl,
          ...(children
            ? { [resolved.children]: attachNormalized(children) }
            : {}),
        }
      })
    return attachNormalized(treeData)
  }, [treeData, resolved])

  const filteredTreeData = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    if (!keyword) return normalizedTreeData
    return mapTree<T, T>(
      normalizedTreeData,
      (node, children) => {
        const matched = filterTreeNode
          ? filterTreeNode(searchValue, node)
          : String(node[resolved.label] ?? '')
              .toLowerCase()
              .includes(keyword)
        if (!matched && children.length === 0) return null
        return {
          ...node,
          [resolved.children]: children.length > 0 ? children : undefined,
        }
      },
      (node) => node[resolved.children] as readonly T[] | null | undefined,
    )
  }, [normalizedTreeData, searchValue, filterTreeNode, resolved])

  const searchExpandedKeys = useMemo(() => {
    if (!searchValue.trim()) return undefined
    return collectAllExpandableKeys(
      filteredTreeData,
      fillFieldNames(treeFieldNames),
    )
  }, [searchValue, filteredTreeData, treeFieldNames])

  const selectedList = useMemo<TreeKey[]>(() => {
    if (activeValue === null || activeValue === undefined) return []
    return Array.isArray(activeValue) ? activeValue : [activeValue]
  }, [activeValue])

  const selectedLabels = useMemo(() => {
    if (!isMulti && activeValue === null && nullLabel !== undefined) {
      return [nullLabel]
    }
    return selectedList.map(
      (k) =>
        findNodeLabel(
          normalizedTreeData,
          k,
          resolved.value,
          resolved.label,
          resolved.children,
        ) ?? String(k),
    )
  }, [
    isMulti,
    activeValue,
    nullLabel,
    selectedList,
    normalizedTreeData,
    resolved,
  ])

  const commitValue = (
    nextValue: TreeKey | TreeKey[] | null,
    triggerValue?: TreeKey | null,
    checked?: boolean,
  ) => {
    if (controlledValue === undefined) {
      setInnerValue(nextValue)
    }
    const nextKeys =
      nextValue === null
        ? []
        : Array.isArray(nextValue)
          ? nextValue
          : [nextValue]
    const nextLabels =
      nextValue === null && nullLabel !== undefined
        ? [nullLabel]
        : nextKeys.map(
            (k) =>
              findNodeLabel(
                normalizedTreeData,
                k,
                resolved.value,
                resolved.label,
                resolved.children,
              ) ?? String(k),
          )
    onChange?.(nextValue, nextLabels, { triggerValue, checked })
  }

  const hasClearableValue =
    allowClear &&
    !disabled &&
    (isMulti
      ? selectedList.length > 0
      : activeValue !== null && activeValue !== undefined)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setSearchValue('')
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="relative flex w-full items-center">
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={ariaLabel}
              disabled={disabled}
              className={cn(
                'h-auto min-h-8 w-full justify-between gap-1.5 py-1 font-normal',
                hasClearableValue && 'pr-12',
                className,
              )}
            />
          }
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-left">
            {isMulti ? (
              selectedList.length > 0 ? (
                selectedList.map((k, idx) => (
                  <Badge
                    key={String(k)}
                    variant="secondary"
                    className="h-5 gap-1 px-1.5 text-[11px] font-normal"
                  >
                    <span className="max-w-32 truncate">
                      {selectedLabels[idx]}
                    </span>
                  </Badge>
                ))
              ) : (
                <span className="truncate text-muted-foreground">
                  {placeholder}
                </span>
              )
            ) : selectedLabels.length > 0 ? (
              <span className="truncate">{selectedLabels[0]}</span>
            ) : (
              <span className="truncate text-muted-foreground">
                {placeholder}
              </span>
            )}
          </span>
          {loading ? (
            <Spinner className="size-3.5 shrink-0 opacity-70" />
          ) : (
            <ChevronDown className="size-3.5 shrink-0 opacity-60" />
          )}
        </PopoverTrigger>
        {hasClearableValue && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation()
              commitValue(isMulti ? [] : null, null, false)
            }}
            className="absolute right-7 inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <PopoverContent
        align="start"
        className={cn('w-(--anchor-width) gap-1.5 p-1.5', popupClassName)}
      >
        {showSearch && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-7 pl-7 text-[12.5px]"
            />
          </div>
        )}

        <div className="max-h-64 overflow-y-auto">
          {!isMulti && nullLabel !== undefined && !searchValue.trim() && (
            <button
              type="button"
              onClick={() => {
                commitValue(null, null, true)
                setOpen(false)
              }}
              className={cn(
                'mb-0.5 flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-[13px] transition-colors hover:bg-accent',
                activeValue === null &&
                  'bg-primary/10 font-medium text-primary',
              )}
            >
              <span className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{nullLabel}</span>
              {activeValue === null && <Check className="size-3.5 shrink-0" />}
            </button>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Spinner className="size-3.5" />
            </div>
          ) : filteredTreeData.length === 0 ? (
            <div className="py-5 text-center text-xs text-muted-foreground">
              {notFoundContent ?? 'No data'}
            </div>
          ) : (
            <TreeRoot<T>
              treeData={filteredTreeData}
              fieldNames={treeFieldNames}
              ariaLabel={ariaLabel}
              blockNode
              showLine={treeLine}
              showIcon={treeIcon}
              defaultExpandAll={treeDefaultExpandAll}
              defaultExpandedKeys={treeDefaultExpandedKeys}
              expandedKeys={searchExpandedKeys ?? treeExpandedKeys}
              onExpand={(keys) => onTreeExpand?.(keys)}
              checkable={treeCheckable}
              selectable={!treeCheckable}
              multiple={multiple}
              checkedKeys={treeCheckable ? selectedList : undefined}
              selectedKeys={!treeCheckable ? selectedList : undefined}
              onCheck={
                treeCheckable
                  ? (checked, info) => {
                      const nextKeys = Array.isArray(checked)
                        ? checked
                        : checked.checked
                      commitValue(nextKeys, info.node.key, info.checked)
                    }
                  : undefined
              }
              onSelect={
                !treeCheckable
                  ? (keys, info) => {
                      if (multiple) {
                        commitValue(keys, info.node.key, info.selected)
                      } else {
                        commitValue(info.node.key, info.node.key, true)
                        setOpen(false)
                      }
                    }
                  : undefined
              }
              titleRender={(node) => {
                const keyVal = node[resolved.value] as TreeKey
                const labelVal = node[resolved.label] as ReactNode
                const isSelected =
                  !treeCheckable && selectedList.includes(keyVal)
                return (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="truncate">{labelVal}</span>
                    {!treeCheckable && isSelected && (
                      <Check className="size-3.5 shrink-0 text-primary" />
                    )}
                  </span>
                )
              }}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
