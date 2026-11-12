import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
<#if allFeatures.hasBoolean>import { Badge } from '@repo/ui/components/badge'
</#if>import { Card } from '@repo/ui/components/card'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
<#if options.security>import { usePermission } from '@/hooks/use-permission'
</#if><#if allFeatures.hasDate && allFeatures.hasDateTime>import { formatDate, formatDateTime } from '@/lib/format'
<#elseif allFeatures.hasDate>import { formatDate } from '@/lib/format'
<#elseif allFeatures.hasDateTime>import { formatDateTime } from '@/lib/format'
</#if>import { withTablePagination } from '@/lib/pagination'
import type { ${entity} } from '../types'
import type { ${entity}State } from './use-${entityKebab}'

function Actions({
  row,
  state,
}: {
  row: ${entity}
  state: ${entity}State
}) {<#if options.security>
  const can = usePermission()</#if>
  return (
    <div className="flex items-center justify-end gap-1">
<#if options.security>      {can(${(options.permissionPrefix + ':update')?js}) && (</#if><#if !options.security>      {</#if>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="编辑"
          title="编辑"
          onClick={() => state.openEdit(row)}
        >
          <Pencil />
        </Button>
<#if options.security>      )}</#if><#if !options.security>      }</#if>
<#if options.security>      {can(${(options.permissionPrefix + ':delete')?js}) && (</#if><#if !options.security>      {</#if>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label="删除"
          title="删除"
          onClick={() => state.requestDelete(row)}
        >
          <Trash2 />
        </Button>
<#if options.security>      )}</#if><#if !options.security>      }</#if>
    </div>
  )
}

/** ${displayName}列表：服务端分页 + 行内编辑 / 删除。 */
export function ${entity}Table({ state }: { state: ${entity}State }) {
  const columns: TanStackColumnsType<${entity}> = [
<#list columns as column>    {
      title: ${column.label?js},
      dataIndex: ${column.javaName?js},
      width: ${column.width},
      minWidth: ${column.minWidth},
      render: (_, row) => <#if column.isPk><span className="font-mono text-[12px] text-muted-foreground">{row.${column.javaName}}</span><#elseif column.isBoolean><Badge variant={row.${column.javaName} ? 'default' : 'secondary'}>{row.${column.javaName} ? '是' : '否'}</Badge><#elseif column.isDateTime><span className="text-[12.5px] text-muted-foreground tabular-nums">{formatDateTime(row.${column.javaName})}</span><#elseif column.isDate><span className="text-[12.5px] text-muted-foreground tabular-nums">{formatDate(row.${column.javaName})}</span><#elseif column.isNumeric><span className="text-[12.5px] tabular-nums">{row.${column.javaName} ?? '—'}</span><#elseif column.isText><span className="block max-w-60 truncate text-[12.5px] text-muted-foreground">{row.${column.javaName} ?? '—'}</span><#elseif column.isJson><span className="block max-w-60 truncate text-[12.5px] text-muted-foreground">{row.${column.javaName} ?? '—'}</span><#else><span className="text-[12.5px]">{row.${column.javaName} ?? '—'}</span></#if>,
    },
</#list>    {
      title: '操作',
      key: 'actions',
      width: 96,
      align: 'right',
      fixed: 'right',
      render: (_, row) => <Actions row={row} state={state} />,
    },
  ]

  return (
    <Card className="min-h-0 flex-1 gap-0 py-0">
      <TanStackTable
        stickyHeader
        fillHeight
        scroll={{ virtual: true }}
        columns={columns}
        dataSource={state.records}
        rowKey="id"
        pagination={withTablePagination(state)}
        loading={state.isFetching}
        toolbar={{
          title: (
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
              ${displayNameJsx}
              <span className="text-[12px] font-normal text-muted-foreground">
                {'共 ' + state.total + ' 条'}
              </span>
            </div>
          ),
        }}
      />
    </Card>
  )
}
