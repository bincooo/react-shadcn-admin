import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Card } from '@repo/ui/components/card'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { usePermission } from '@/hooks/use-permission'
import { formatDateTime } from '@/lib/format'
import { withTablePagination } from '@/lib/pagination'
import type { Order } from '../types'
import type { OrderState } from './use-order'

function Actions({
  row,
  state,
}: {
  row: Order
  state: OrderState
}) {
  const can = usePermission()
  return (
    <div className="flex items-center justify-end gap-1">
      {can('system:order:update') && (
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
      {can('system:order:delete') && (
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

/** 订单列表：服务端分页 + 行内编辑 / 删除。 */
export function OrderTable({ state }: { state: OrderState }) {
  const columns: TanStackColumnsType<Order> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 120,
      minWidth: 90,
      render: (_, row) => <span className="font-mono text-[12px] text-muted-foreground">{row.id}</span>,
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="text-[12.5px]">{row.orderNo ?? '—'}</span>,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="text-[12.5px]">{row.customerName ?? '—'}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      minWidth: 90,
      render: (_, row) => <span className="text-[12.5px] tabular-nums">{row.amount ?? '—'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      minWidth: 90,
      render: (_, row) => <span className="text-[12.5px]">{row.status ?? '—'}</span>,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 220,
      minWidth: 165,
      render: (_, row) => <span className="block max-w-60 truncate text-[12.5px] text-muted-foreground">{row.remark ?? '—'}</span>,
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
              {"订单"}
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
