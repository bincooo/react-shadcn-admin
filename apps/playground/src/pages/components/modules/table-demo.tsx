import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@repo/ui/components/card'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { StatusBadge } from '@/components/common/status-badge'
import { formatDate } from '@/lib/format'

interface TeamMember {
  id: string
  name: string
  department: string
  role: string
  active: boolean
  salary: number
  joinedAt: string
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Ada Lovelace',
    department: 'Engineering',
    role: 'Tech Lead',
    active: true,
    salary: 18200,
    joinedAt: '2021-03-15T08:00:00.000Z',
  },
  {
    id: '2',
    name: 'Grace Hopper',
    department: 'Engineering',
    role: 'Backend Engineer',
    active: true,
    salary: 15600,
    joinedAt: '2022-07-01T08:00:00.000Z',
  },
  {
    id: '3',
    name: 'Alan Turing',
    department: 'Engineering',
    role: 'Frontend Engineer',
    active: true,
    salary: 14800,
    joinedAt: '2022-11-09T08:00:00.000Z',
  },
  {
    id: '4',
    name: 'Margaret Hamilton',
    department: 'Engineering',
    role: 'Staff Engineer',
    active: false,
    salary: 17400,
    joinedAt: '2020-05-22T08:00:00.000Z',
  },
  {
    id: '5',
    name: 'Dieter Rams',
    department: 'Design',
    role: 'Design Director',
    active: true,
    salary: 16800,
    joinedAt: '2019-09-02T08:00:00.000Z',
  },
  {
    id: '6',
    name: 'Massimo Vignelli',
    department: 'Design',
    role: 'Visual Designer',
    active: true,
    salary: 13200,
    joinedAt: '2023-01-16T08:00:00.000Z',
  },
  {
    id: '7',
    name: 'Ray Eames',
    department: 'Design',
    role: 'Product Designer',
    active: false,
    salary: 12600,
    joinedAt: '2023-06-12T08:00:00.000Z',
  },
  {
    id: '8',
    name: 'Marty Cagan',
    department: 'Product',
    role: 'Product Manager',
    active: true,
    salary: 15400,
    joinedAt: '2021-10-04T08:00:00.000Z',
  },
  {
    id: '9',
    name: 'Teresa Torres',
    department: 'Product',
    role: 'Product Manager',
    active: true,
    salary: 14900,
    joinedAt: '2022-02-21T08:00:00.000Z',
  },
  {
    id: '10',
    name: 'Eliyahu Goldratt',
    department: 'Operations',
    role: 'Operations Lead',
    active: true,
    salary: 14100,
    joinedAt: '2020-12-07T08:00:00.000Z',
  },
  {
    id: '11',
    name: 'W. Edwards Deming',
    department: 'Operations',
    role: 'Quality Analyst',
    active: false,
    salary: 11800,
    joinedAt: '2023-08-28T08:00:00.000Z',
  },
  {
    id: '12',
    name: 'Taiichi Ohno',
    department: 'Operations',
    role: 'Process Engineer',
    active: true,
    salary: 13500,
    joinedAt: '2024-01-08T08:00:00.000Z',
  },
]

/**
 * 表格列表演示：固定数据上的排序、筛选、多选、分页与列配置。
 * 与业务列表同构，工具栏、多选与分页均由 `@repo/table` 提供。
 */
export function TableDemo() {
  const { t } = useTranslation()
  // 多选受控：翻页后仍保留已勾选的行，与业务列表一致
  const [selectedState, setSelected] = useState<string[]>([])
  const columns: TanStackColumnsType<TeamMember> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
      filterMode: 'search',
      width: 180,
      minWidth: 140,
      fixed: 'left',
      render: (_, { name }) => (
        <span className="text-[13px] font-medium">{name}</span>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      sorter: true,
      filterMode: 'menu',
      width: 150,
      minWidth: 110,
      render: (_, { department }) => (
        <span className="text-[12.5px] text-muted-foreground">
          {department}
        </span>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      sorter: true,
      filterMode: 'search',
      width: 170,
      minWidth: 130,
    },
    {
      title: 'Status',
      dataIndex: 'active',
      sorter: true,
      filterMode: 'menu',
      filterMultiple: false,
      filters: [
        { text: t('common.enabled'), value: true },
        { text: t('common.disabled'), value: false },
      ],
      width: 110,
      minWidth: 90,
      render: (_, { active }) => <StatusBadge enabled={active} />,
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      sorter: true,
      filterMode: 'numberRange',
      filterUnit: '$',
      width: 130,
      minWidth: 100,
      align: 'right',
      render: (_, { salary }) => (
        <span className="text-[12.5px] tabular-nums">
          ${salary.toLocaleString('en-US')}
        </span>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      sorter: true,
      filterMode: 'dateRange',
      width: 130,
      minWidth: 110,
      align: 'right',
      render: (_, { joinedAt }) => (
        <span className="text-[12.5px] text-muted-foreground tabular-nums">
          {formatDate(joinedAt)}
        </span>
      ),
    },
  ]

  return (
    <Card className="h-[420px] min-h-0 gap-0 py-0">
      <TanStackTable
        stickyHeader
        fillHeight
        columns={columns}
        dataSource={TEAM_MEMBERS}
        rowKey="id"
        filterDisplay="row"
        pagination={{
          defaultPageSize: 5,
          pageSizeOptions: [5, 10, 20],
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        selection={{
          selectedRowKeys: selectedState,
          onChange: (keys) => setSelected(keys),
          fixed: true,
        }}
        toolbar={{
          title: (
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
              {t('page.tableDemo')}
              <span className="text-[12px] font-normal text-muted-foreground">
                {t('common.total', { total: TEAM_MEMBERS.length })}
              </span>
            </div>
          ),
          description: t('page.tableDemoDesc'),
        }}
      />
    </Card>
  )
}
