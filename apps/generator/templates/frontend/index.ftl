import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { DeleteDialog } from '@/components/common/delete-dialog'
import { Header } from '@/components/common/header'
<#if options.security>import { PermissionButton } from '@/components/common/permission-button'
</#if>import {
  SearchPanel,
  SearchTextField,
} from '@/components/common/search-panel'
import { ${entity}Dialog } from './modules/dialog'
import { ${entity}Table } from './modules/table'
import { use${entity} } from './modules/use-${entityKebab}'

/** ${displayName}：分页列表与新建 / 编辑 / 删除。 */
export default function ${entity}Page() {
  const state = use${entity}()
  const deleteName = state.deleting
    ? String(state.deleting.${displayColumn.javaName} ?? state.deleting.id)
    : ''

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <Header
        title=${displayNameJsx}
        description=<#if definition.comment?has_content>${definition.comment?jsx}<#else>${(displayName + '维护。')?jsx}</#if>
        actions={
          <>
            <Button variant="outline" onClick={state.refresh}>
              <RefreshCw data-icon="inline-start" />
              {'刷新'}
            </Button>
<#if options.security>            <PermissionButton
              permission=${(options.permissionPrefix + ':create')?js}
              onClick={state.openCreate}
            >
              <Plus data-icon="inline-start" />
              {'新增'}
            </PermissionButton>
<#else>            <Button onClick={state.openCreate}>
              <Plus data-icon="inline-start" />
              {'新增'}
            </Button>
</#if>          </>
        }
      />
      <SearchPanel
        primary={
          <SearchTextField
            id="${entityKebab}-keyword"
            label={'关键词'}
            placeholder={'请输入'}
            value={state.keyword}
            onChange={state.setKeyword}
            onSearch={state.submitSearch}
          />
        }
        onReset={state.resetFilters}
        onSearch={state.submitSearch}
      />
      <${entity}Table state={state} />
      <${entity}Dialog
        key={`\${state.dialog.editing?.id ?? 'create'}-\${state.dialog.open}`}
        state={state}
      />
      <DeleteDialog
        open={state.deleting !== null}
        description={
          state.deleting
            ? '确认删除${displayName}「' + deleteName + '」？删除后不可恢复。'
            : ''
        }
        pending={state.deleteMutation.isPending}
        onClose={state.closeDelete}
        onConfirm={() => {
          if (state.deleting) state.deleteMutation.mutate(state.deleting.id)
        }}
      />
    </div>
  )
}
