import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Card } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Switch } from '@repo/ui/components/switch'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'

interface EditableRow {
  id: string
  name: string
  role: string
  active: boolean
  salary: number
}

const INITIAL_ROWS: EditableRow[] = [
  {
    id: '1',
    name: 'Ada Lovelace',
    role: 'Tech Lead',
    active: true,
    salary: 18200,
  },
  {
    id: '2',
    name: 'Grace Hopper',
    role: 'Backend Engineer',
    active: true,
    salary: 15600,
  },
  {
    id: '3',
    name: 'Dieter Rams',
    role: 'Design Director',
    active: false,
    salary: 16800,
  },
  {
    id: '4',
    name: 'Marty Cagan',
    role: 'Product Manager',
    active: true,
    salary: 15400,
  },
]

/**
 * 可编辑表格演示：单元格直接渲染受控表单控件，编辑结果写入组件本地状态。
 *
 * 列不启用排序/筛选，避免输入过程中数据被重排；可编辑列关闭 `lightCell`，
 * 避免进入编辑时点击单元格出现选中边框；工具栏提供一键还原。
 */
export function EditableTableDemo() {
  const { t } = useTranslation()
  const [rowsState, setRows] = useState(INITIAL_ROWS)

  const updateRow = (id: string, patch: Partial<EditableRow>) =>
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    )

  const columns: TanStackColumnsType<EditableRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      lightCell: false,
      width: 200,
      minWidth: 140,
      render: (_, { id, name }) => (
        <Input
          className="h-7 text-[12.5px]"
          aria-label={`Name ${name}`}
          value={name}
          onChange={(event) => updateRow(id, { name: event.target.value })}
        />
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      lightCell: false,
      width: 200,
      minWidth: 140,
      render: (_, { id, name, role }) => (
        <Input
          className="h-7 text-[12.5px]"
          aria-label={`Role ${name}`}
          value={role}
          onChange={(event) => updateRow(id, { role: event.target.value })}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      lightCell: false,
      width: 100,
      minWidth: 90,
      render: (_, { id, name, active }) => (
        <Switch
          checked={active}
          aria-label={`Status ${name}`}
          onCheckedChange={(nextActive) =>
            updateRow(id, { active: nextActive })
          }
        />
      ),
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      lightCell: false,
      width: 140,
      minWidth: 110,
      align: 'right',
      render: (_, { id, name, salary }) => (
        <Input
          className="h-7 text-right text-[12.5px] tabular-nums"
          type="number"
          aria-label={`Salary ${name}`}
          value={salary}
          onChange={(event) => {
            const nextSalary = event.target.valueAsNumber
            updateRow(id, {
              salary: Number.isNaN(nextSalary) ? 0 : nextSalary,
            })
          }}
        />
      ),
    },
  ]

  return (
    <Card className="h-[420px] min-h-0 min-w-0 gap-0 py-0">
      <TanStackTable
        stickyHeader
        fillHeight
        columns={columns}
        dataSource={rowsState}
        rowKey="id"
        filterDisplay="none"
        pagination={false}
        toolbar={{
          title: t('page.editableTableDemo'),
          description: t('page.editableTableDemoDesc'),
          extra: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRows(INITIAL_ROWS)}
            >
              <RotateCcw data-icon="inline-start" />
              {t('common.reset')}
            </Button>
          ),
        }}
      />
    </Card>
  )
}
