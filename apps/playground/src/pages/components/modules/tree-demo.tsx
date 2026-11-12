import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Folder } from 'lucide-react'
import { Switch } from '@repo/ui/components/switch'
import {
  Tree,
  type AntTreeNodeProps,
  type TreeDataNode,
  type TreeKey,
} from '@repo/tree'
import { SectionCard } from '@/components/common/section-card'

const TREE_DATA: TreeDataNode[] = [
  {
    key: 'src',
    title: 'src',
    children: [
      {
        key: 'src/app',
        title: 'app',
        children: [
          { key: 'src/app/page.tsx', title: 'page.tsx' },
          { key: 'src/app/layout.tsx', title: 'layout.tsx' },
          { key: 'src/app/globals.css', title: 'globals.css' },
        ],
      },
      {
        key: 'src/components',
        title: 'components',
        children: [
          { key: 'src/components/button.tsx', title: 'button.tsx' },
          { key: 'src/components/table.tsx', title: 'table.tsx' },
          { key: 'src/components/tree.tsx', title: 'tree.tsx' },
        ],
      },
      {
        key: 'src/lib',
        title: 'lib',
        children: [
          { key: 'src/lib/utils.ts', title: 'utils.ts' },
          { key: 'src/lib/format.ts', title: 'format.ts' },
        ],
      },
    ],
  },
  { key: 'package.json', title: 'package.json' },
  { key: 'README.md', title: 'README.md' },
]

/** 目录节点用文件夹图标，叶子用文件图标 */
function nodeIcon(props: AntTreeNodeProps<TreeDataNode>) {
  return props.data.children?.length ? (
    <Folder className="size-3.5 text-amber-500" />
  ) : (
    <FileText className="size-3.5 text-muted-foreground" />
  )
}

/**
 * 树组件演示：左为可选中树，右为父子级联勾选树（可切严格模式）。
 * 展开、选中、勾选均为受控状态，与业务页面的树形选择用法一致。
 */
export function TreeDemo() {
  const { t } = useTranslation()
  const [selectedKeys, setSelectedKeys] = useState<TreeKey[]>(['src/app'])
  const [checkedKeys, setCheckedKeys] = useState<TreeKey[]>([
    'src/app/page.tsx',
    'src/components/table.tsx',
  ])
  const [strictState, setStrict] = useState(false)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard
        title={t('page.treeSelectable')}
        description={t('page.treeSelectableDesc')}
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border p-2">
            <Tree
              treeData={TREE_DATA}
              showIcon
              icon={nodeIcon}
              showLine={{ showLeafIcon: false }}
              blockNode
              defaultExpandAll
              selectedKeys={selectedKeys}
              onSelect={(keys) => setSelectedKeys(keys)}
            />
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            {t('page.selectedNode', {
              name: selectedKeys.length > 0 ? String(selectedKeys[0]) : '—',
            })}
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title={t('page.treeCheckable')}
        description={t('page.treeCheckableDesc')}
        actions={
          <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            {t('page.strictMode')}
            <Switch
              checked={strictState}
              onCheckedChange={setStrict}
              aria-label={t('page.strictMode')}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border p-2">
            <Tree
              treeData={TREE_DATA}
              checkable
              checkStrictly={strictState}
              showIcon
              icon={nodeIcon}
              showLine={{ showLeafIcon: false }}
              blockNode
              defaultExpandAll
              checkedKeys={checkedKeys}
              onCheck={(checked) =>
                setCheckedKeys(
                  Array.isArray(checked) ? checked : checked.checked,
                )
              }
            />
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            {t('page.checkedCount', { count: checkedKeys.length })}
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
