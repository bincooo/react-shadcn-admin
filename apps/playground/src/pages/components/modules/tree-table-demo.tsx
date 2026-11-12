import { useTranslation } from 'react-i18next'
import { Card } from '@repo/ui/components/card'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { StatusBadge } from '@/components/common/status-badge'

interface OrgRow {
  id: string
  name: string
  owner: string
  headcount: number
  budget: number
  status: 'ENABLED' | 'DISABLED'
  children?: OrgRow[]
}

const ORG_TREE: OrgRow[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    owner: 'Ada Lovelace',
    headcount: 42,
    budget: 520000,
    status: 'ENABLED',
    children: [
      {
        id: 'platform',
        name: 'Platform',
        owner: 'Grace Hopper',
        headcount: 18,
        budget: 240000,
        status: 'ENABLED',
        children: [
          {
            id: 'backend',
            name: 'Backend',
            owner: 'Alan Turing',
            headcount: 10,
            budget: 140000,
            status: 'ENABLED',
          },
          {
            id: 'infrastructure',
            name: 'Infrastructure',
            owner: 'Margaret Hamilton',
            headcount: 8,
            budget: 100000,
            status: 'DISABLED',
          },
        ],
      },
      {
        id: 'frontend',
        name: 'Frontend',
        owner: 'Lin Clark',
        headcount: 14,
        budget: 160000,
        status: 'ENABLED',
      },
    ],
  },
  {
    id: 'design',
    name: 'Design',
    owner: 'Dieter Rams',
    headcount: 16,
    budget: 190000,
    status: 'ENABLED',
    children: [
      {
        id: 'product-design',
        name: 'Product Design',
        owner: 'Ray Eames',
        headcount: 9,
        budget: 110000,
        status: 'ENABLED',
      },
      {
        id: 'brand',
        name: 'Brand',
        owner: 'Massimo Vignelli',
        headcount: 7,
        budget: 80000,
        status: 'ENABLED',
      },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    owner: 'Eliyahu Goldratt',
    headcount: 22,
    budget: 210000,
    status: 'ENABLED',
  },
]

const columns: TanStackColumnsType<OrgRow> = [
  {
    title: 'Team',
    dataIndex: 'name',
    treeColumn: true,
    width: 260,
    minWidth: 180,
    render: (_, { name }) => (
      <span className="text-[13px] font-medium">{name}</span>
    ),
  },
  {
    title: 'Owner',
    dataIndex: 'owner',
    width: 200,
    minWidth: 140,
    render: (_, { owner }) => (
      <span className="text-[12.5px] text-muted-foreground">{owner}</span>
    ),
  },
  {
    title: 'Headcount',
    dataIndex: 'headcount',
    width: 120,
    minWidth: 90,
    align: 'right',
    render: (_, { headcount }) => (
      <span className="text-[12.5px] tabular-nums">{headcount}</span>
    ),
  },
  {
    title: 'Budget',
    dataIndex: 'budget',
    width: 140,
    minWidth: 110,
    align: 'right',
    render: (_, { budget }) => (
      <span className="text-[12.5px] text-muted-foreground tabular-nums">
        ${budget.toLocaleString('en-US')}
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    width: 110,
    minWidth: 90,
    render: (_, { status }) => <StatusBadge enabled={status === 'ENABLED'} />,
  },
]

/**
 * 树形表格演示：行数据通过 `children` 表达层级，首列作为树列承载
 * 展开/收起与层级缩进，默认展开全部节点并绘制连接线。
 */
export function TreeTableDemo() {
  const { t } = useTranslation()

  return (
    <Card className="h-[420px] min-h-0 min-w-0 gap-0 py-0">
      <TanStackTable
        stickyHeader
        fillHeight
        columns={columns}
        dataSource={ORG_TREE}
        rowKey="id"
        filterDisplay="none"
        pagination={false}
        expandable={{
          childrenColumnName: 'children',
          defaultExpandAllTreeRows: true,
          indentSize: 20,
          treeLine: true,
        }}
        toolbar={{
          title: t('page.treeTableDemo'),
          description: t('page.treeTableDemoDesc'),
        }}
      />
    </Card>
  )
}
