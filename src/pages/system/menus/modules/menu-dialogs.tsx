import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Folder } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/system/form-sheet'
import type { SystemMenu, SystemMenuInput } from '@/api/system/menu'
import { cn } from '@/lib/utils'
import { MENU_TYPE_LABEL_KEYS, findMenuNode } from './menu-tree'
import type { MenusSyncState } from './use-menus-sync'
import { MenuIconPicker } from './menu-icon-picker'
import { MenuTypeIcon, MenusTree } from './menus-tree'

/* ----------------------------- 父级菜单候选树 ----------------------------- */

/**
 * 剪掉编辑目标自身子树，防止把菜单挂到自己的后代上形成环（后端同样校验）。
 * 命中排除集的节点连同其后代整体移除。
 */
function pruneExcluded(
  nodes: SystemMenu[],
  excludedCodes: ReadonlySet<string>,
): SystemMenu[] {
  return nodes
    .filter((node) => !excludedCodes.has(node.menuCode))
    .map((node) => ({
      ...node,
      children: node.children?.length
        ? pruneExcluded(node.children, excludedCodes)
        : undefined,
    }))
}

/* ----------------------------- 新建 / 编辑菜单 ----------------------------- */

interface FormState {
  parentCode: string
  menuCode: string
  menuName: string
  menuType: SystemMenu['menuType']
  menuUrl: string
  imageIcon: string
  seq: string
  enabled: boolean
}

function toFormState(
  editing: SystemMenu | null,
  parentCode: string,
  buttonMode: boolean,
): FormState {
  return {
    parentCode: editing?.parentMenuCode ?? parentCode,
    menuCode: editing?.menuCode ?? '',
    menuName: editing?.menuName ?? '',
    // 按钮创建模式类型固定为 BUTTON；新建默认 MENU
    menuType: buttonMode ? 'BUTTON' : (editing?.menuType ?? 'MENU'),
    menuUrl: editing?.menuUrl ?? '',
    imageIcon: editing?.imageIcon ?? '',
    seq: String(editing?.seq ?? 0),
    enabled: editing?.status !== 'DISABLED',
  }
}

/** 表单校验：镜像后端跨字段规则（MENU / DIRECTORY 必填路由） */
function validate(form: FormState): string | null {
  if (!form.menuCode.trim()) {
    return 'system.menu.error.code'
  }
  if (!form.menuName.trim()) {
    return form.menuType === 'BUTTON'
      ? 'system.menu.error.permissionName'
      : 'system.menu.error.name'
  }
  if (form.menuType !== 'BUTTON' && !form.menuUrl.trim()) {
    return 'system.menu.error.routePath'
  }
  if (!/^\d+$/.test(form.seq) || Number(form.seq) < 0) {
    return 'system.menu.error.seq'
  }
  return null
}

/**
 * 新建/编辑菜单抽屉：创建需填编码且恒为启用，编辑不可改编码。
 * 父级下拉从管理树平铺，编辑时排除自身子树防止成环（后端同样校验）。
 */
export function MenuDialog({ menusSync }: { menusSync: MenusSyncState }) {
  const { t } = useTranslation()
  const editing = menusSync.dialogState.editing
  const isCreate = editing === null
  const buttonMode = menusSync.dialogState.buttonMode
  // 按钮表单：从权限列表的「添加」进入，或编辑目标本身是按钮（类型固定为按钮）
  const isButtonForm = buttonMode || editing?.menuType === 'BUTTON'
  const actionLabel = isCreate ? t('common.create') : t('common.edit')
  const buttonLabel = isCreate
    ? t('system.menu.addButton')
    : t('system.menu.editButton')
  const title = isButtonForm ? buttonLabel : actionLabel
  // 表单初值由父组件的 key 重挂载保证（见 index.tsx），这里只在首次渲染取值
  const [formState, setForm] = useState<FormState>(() =>
    toFormState(editing, menusSync.dialogState.parentCode, buttonMode),
  )

  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))

  const pendingState = menusSync.saveMutation.isPending
  // 父级候选为树形（仅目录与页面，MenusTree 内部会剥掉按钮），编辑目标自身子树剪掉
  const [parentPickerOpenState, setParentPickerOpen] = useState(false)
  const parentCandidates = useMemo(
    () => pruneExcluded(menusSync.menus, menusSync.excludedCodes),
    [menusSync.menus, menusSync.excludedCodes],
  )
  const selectedParent = formState.parentCode
    ? findMenuNode(menusSync.allMenus, formState.parentCode)
    : null
  // 选中项名称走 i18n；查不到（数据异常）时回退原始编码
  const parentTriggerLabel = selectedParent
    ? t(selectedParent.menuName)
    : formState.parentCode

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    const invalid = validate(formState)
    if (invalid) {
      toast.error(t(invalid))
      return
    }

    const input: SystemMenuInput = {
      menuCode: formState.menuCode.trim(),
      parentMenuCode: formState.parentCode,
      menuName: formState.menuName.trim(),
      menuType: formState.menuType,
      menuUrl: formState.menuUrl.trim(),
      imageIcon: formState.imageIcon.trim(),
      seq: Number(formState.seq),
      status: formState.enabled ? 'ENABLED' : 'DISABLED',
    }
    menusSync.saveMutation.mutate({
      menuCode: isCreate ? null : editing.menuCode,
      input,
    })
  }

  return (
    <FormSheet
      open={menusSync.dialogState.open}
      onClose={menusSync.closeDialog}
      title={title}
      description={
        isButtonForm
          ? t('system.menu.buttonDialogHint')
          : t('system.menu.formHint')
      }
      pendingState={pendingState}
      onSubmit={submit}
    >
      {!isButtonForm && (
        <FormField
          label={t('system.menu.parentMenu')}
          htmlFor="system-menu-parent"
        >
          <Popover
            open={parentPickerOpenState}
            onOpenChange={setParentPickerOpen}
          >
            <PopoverTrigger asChild>
              <Button
                id="system-menu-parent"
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {selectedParent && selectedParent.menuType !== 'BUTTON' && (
                    <MenuTypeIcon
                      type={selectedParent.menuType}
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span className="truncate">
                    {parentTriggerLabel || t('system.menu.rootDirectory')}
                  </span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            {/* 宽度跟随触发器；高度受限内部滚动，树默认全展开可收起 */}
            <PopoverContent
              className="max-h-72 w-(--radix-popover-trigger-width) overflow-y-auto p-1"
              align="start"
            >
              {/* 根目录行与树行同一套选中/悬停语言，避免两个视觉体系 */}
              <button
                type="button"
                role="treeitem"
                aria-selected={!formState.parentCode}
                onClick={() => {
                  setField({ parentCode: '' })
                  setParentPickerOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-muted/60',
                  !formState.parentCode &&
                    'bg-primary/10 font-medium text-primary',
                )}
              >
                <Folder className="size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">根目录</span>
                {!formState.parentCode && (
                  <Check className="size-3.5 shrink-0" />
                )}
              </button>
              <MenusTree
                menus={parentCandidates}
                selectedCode={formState.parentCode}
                onSelect={(menu) => {
                  setField({ parentCode: menu.menuCode })
                  setParentPickerOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </FormField>
      )}
      <FormField
        label={t('system.menu.code')}
        htmlFor="system-menu-code"
        hint={!isCreate ? t('system.menu.codeImmutable') : undefined}
      >
        <Input
          id="system-menu-code"
          value={formState.menuCode}
          disabled={!isCreate}
          autoFocus
          onChange={(e) => setField({ menuCode: e.target.value })}
          autoComplete="off"
        />
      </FormField>
      <FormField
        label={
          isButtonForm ? t('system.menu.permissionName') : t('system.menu.name')
        }
        htmlFor="system-menu-name"
      >
        <Input
          id="system-menu-name"
          value={formState.menuName}
          onChange={(e) => setField({ menuName: e.target.value })}
          autoComplete="off"
        />
      </FormField>
      {!isButtonForm && (
        // 按钮权限只能从按钮权限列表的「添加」入口创建，常规新建不提供 BUTTON
        <FormField
          label={t('system.menu.typeLabel')}
          htmlFor="system-menu-type"
        >
          <Select
            value={formState.menuType}
            onValueChange={(value) =>
              setField({ menuType: value as SystemMenu['menuType'] })
            }
          >
            <SelectTrigger id="system-menu-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['DIRECTORY', 'MENU'] as SystemMenu['menuType'][]).map(
                (type) => (
                  <SelectItem key={type} value={type}>
                    {t(MENU_TYPE_LABEL_KEYS[type])}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FormField>
      )}
      {formState.menuType !== 'BUTTON' && (
        <FormField label={t('system.menu.routePath')} htmlFor="system-menu-url">
          <Input
            id="system-menu-url"
            value={formState.menuUrl}
            placeholder="/system/menus"
            onChange={(e) => setField({ menuUrl: e.target.value })}
          />
        </FormField>
      )}
      {!isButtonForm && (
        <FormField label={t('system.menu.icon')} htmlFor="system-menu-icon">
          <MenuIconPicker
            id="system-menu-icon"
            value={formState.imageIcon}
            onChange={(imageIcon) => setField({ imageIcon })}
          />
        </FormField>
      )}
      <FormField label={t('system.field.sort')} htmlFor="system-menu-seq">
        <Input
          id="system-menu-seq"
          type="number"
          min={0}
          value={formState.seq}
          onChange={(e) => setField({ seq: e.target.value })}
        />
      </FormField>
      <FormSwitchField
        label={t('common.status')}
        htmlFor="system-menu-enabled"
        checked={formState.enabled}
        onCheckedChange={(enabled) => setField({ enabled })}
      />
    </FormSheet>
  )
}
