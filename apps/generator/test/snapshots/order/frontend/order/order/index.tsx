import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { DeleteDialog } from '@/components/common/delete-dialog'
import { Header } from '@/components/common/header'
import { PermissionButton } from '@/components/common/permission-button'
import {
  SearchPanel,
  SearchTextField,
} from '@/components/common/search-panel'
import { OrderDialog } from './modules/dialog'
import { OrderTable } from './modules/table'
import { useOrder } from './modules/use-order'

/** 订单：分页列表与新建 / 编辑 / 删除。 */
export default function OrderPage() {
  const state = useOrder()
  const deleteName = state.deleting
    ? String(state.deleting.orderNo ?? state.deleting.id)
    : ''

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <Header
        title={"订单"}
        description={"订单主表"}
        actions={
          <>
            <Button variant="outline" onClick={state.refresh}>
              <RefreshCw data-icon="inline-start" />
              {'刷新'}
            </Button>
            <PermissionButton
              permission='system:order:create'
              onClick={state.openCreate}
            >
              <Plus data-icon="inline-start" />
              {'新增'}
            </PermissionButton>
          </>
        }
      />
      <SearchPanel
        primary={
          <SearchTextField
            id="order-keyword"
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
      <OrderTable state={state} />
      <OrderDialog
        key={`${state.dialog.editing?.id ?? 'create'}-${state.dialog.open}`}
        state={state}
      />
      <DeleteDialog
        open={state.deleting !== null}
        description={
          state.deleting
            ? '确认删除订单「' + deleteName + '」？删除后不可恢复。'
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
