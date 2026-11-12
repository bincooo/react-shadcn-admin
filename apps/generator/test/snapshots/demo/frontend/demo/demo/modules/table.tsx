import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { Card } from '@repo/ui/components/card'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { usePermission } from '@/hooks/use-permission'
import { formatDate, formatDateTime } from '@/lib/format'
import { withTablePagination } from '@/lib/pagination'
import type { Demo } from '../types'
import type { DemoState } from './use-demo'

function Actions({
  row,
  state,
}: {
  row: Demo
  state: DemoState
}) {
  const can = usePermission()
  return (
    <div className="flex items-center justify-end gap-1">
      {can('system:demo:update') && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="编辑"
          title="编辑"
          onClick={() => state.openEdit(row)}
        >
          <Pencil />
        </Button>
      )}
      {can('system:demo:delete') && (
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
      )}
    </div>
  )
}

/** 演示列表：服务端分页 + 行内编辑 / 删除。 */
export function DemoTable({ state }: { state: DemoState }) {
  const columns: TanStackColumnsType<Demo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 120,
      minWidth: 90,
      render: (_, row) => <span className="font-mono text-[12px] text-muted-foreground">{row.id}</span>,
    },
    {
      title: '编码',
      dataIndex: 'code',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="text-[12.5px]">{row.code ?? '—'}</span>,
    },
    {
      title: '描述',
      dataIndex: 'descText',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="block max-w-60 truncate text-[12.5px] text-muted-foreground">{row.descText ?? '—'}</span>,
    },
    {
      title: '数量',
      dataIndex: 'qty',
      width: 120,
      minWidth: 90,
      render: (_, row) => <span className="text-[12.5px] tabular-nums">{row.qty ?? '—'}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      minWidth: 90,
      render: (_, row) => <span className="text-[12.5px] tabular-nums">{row.amount ?? '—'}</span>,
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 90,
      minWidth: 68,
      render: (_, row) => <Badge variant={row.enabled ? 'default' : 'secondary'}>{row.enabled ? '是' : '否'}</Badge>,
    },
    {
      title: '业务日期',
      dataIndex: 'bizDate',
      width: 120,
      minWidth: 90,
      render: (_, row) => <span className="text-[12.5px] text-muted-foreground tabular-nums">{formatDate(row.bizDate)}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      width: 170,
      minWidth: 128,
      render: (_, row) => <span className="text-[12.5px] text-muted-foreground tabular-nums">{formatDateTime(row.createdTime)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      minWidth: 90,
      render: (_, row) => <span className="text-[12.5px]">{row.status ?? '—'}</span>,
    },
    {
      title: '扩展',
      dataIndex: 'extra',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="block max-w-60 truncate text-[12.5px] text-muted-foreground">{row.extra ?? '—'}</span>,
    },
    {
      title: '追踪号',
      dataIndex: 'traceId',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="text-[12.5px]">{row.traceId ?? '—'}</span>,
    },
    {
      title: '创建部门',
      dataIndex: 'createdDept',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="text-[12.5px]">{row.createdDept ?? '—'}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      minWidth: 128,
      render: (_, row) => <span className="text-[12.5px] text-muted-foreground tabular-nums">{formatDateTime(row.createdAt)}</span>,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="text-[12.5px]">{row.createdBy ?? '—'}</span>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      minWidth: 128,
      render: (_, row) => <span className="text-[12.5px] text-muted-foreground tabular-nums">{formatDateTime(row.updatedAt)}</span>,
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="text-[12.5px]">{row.updatedBy ?? '—'}</span>,
    },
    {
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
              {"演示"}
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
