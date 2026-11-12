import { useMemo, useState, type FormEvent } from 'react'
import { Check, ChevronDown, Folder } from 'lucide-react'
import { iconNames } from 'lucide-react/dynamic'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/common/form-sheet'
import { Icon } from '@/components/common/icon'
import { useFormValidation } from '@/hooks/use-form-validation'
import type { Menu, MenuInput } from '@/api/system/menu'
import { filterTree } from '@repo/tree'
import { isIconName, withIconName } from '@/lib/icon-name'
import { cn } from '@/lib/utils'
import { MENU_TYPE_LABELS, findMenuNode, menuNameLabel } from './model'
import type { MenuState } from './use-menu'
import { MenuNodeIcon, MenusTree } from './tree'

/* ----------------------------- 新建 / 编辑菜单 ----------------------------- */

interface FormState {
  parentId: string
  menuCode: string
  menuName: string
  menuType: Menu['menuType']
  menuUrl: string
  imageIcon: string
  seq: string
  enabled: boolean
}

function withFormState(
  editing: Menu | null,
  parentId: string,
  buttonMode: boolean,
): FormState {
  return {
    parentId: editing?.parentMenuId ?? parentId,
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

/** 校验菜单与按钮权限的必填项及排序值。 */
function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.menuCode.trim()) errors.menuCode = '请输入菜单编码'
  if (!form.menuName.trim())
    errors.menuName =
      form.menuType === 'BUTTON' ? '请输入权限名称' : '请输入菜单名称'
  if (form.menuType !== 'BUTTON' && !form.menuUrl.trim())
    errors.menuUrl = '页面与目录类型必须填写路由地址'
  if (!/^\d+$/.test(form.seq) || !Number.isSafeInteger(Number(form.seq)))
    errors.seq = '排序值必须是可安全表示的非负整数'
  return errors
}

/**
 * 新建/编辑菜单抽屉：创建需填编码且恒为启用，编辑不可改编码。
 * 父级下拉从管理树平铺，编辑时排除自身子树防止成环（后端同样校验）。
 */
export function MenuDialog({ menuMgr }: { menuMgr: MenuState }) {
  const menuTypeOptions = (['DIRECTORY', 'MENU'] as Menu['menuType'][]).map(
    (type) => ({ value: type, label: MENU_TYPE_LABELS[type] }),
  )
  const editing = menuMgr.dialog.editing
  const isCreate = editing === null
  const buttonMode = menuMgr.dialog.buttonMode
  // 按钮表单：从权限列表的「添加」进入，或编辑目标本身是按钮（类型固定为按钮）
  const isButtonForm = buttonMode || editing?.menuType === 'BUTTON'
  const actionLabel = isCreate ? '新增' : '编辑'
  const buttonLabel = isCreate ? '新增按钮权限' : '编辑按钮权限'
  const title = isButtonForm ? buttonLabel : actionLabel
  // 表单初值由父组件的 key 重挂载保证（见 index.tsx），这里只在首次渲染取值
  const [formState, setForm] = useState<FormState>(() =>
    withFormState(editing, menuMgr.dialog.parentId, buttonMode),
  )

  const { errors, validateBeforeSubmit, getFieldProps } = useFormValidation(
    formState,
    (values) => validate(values),
  )

  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))

  const pendingState = menuMgr.saveMutation.isPending
  // 父级候选为树形（仅目录与页面，MenusTree 内部会剥掉按钮）；
  // 编辑时剪掉目标自身子树，防止把菜单挂到自己的后代上形成环（后端同样校验）
  const [parentPickerOpenState, setParentPickerOpen] = useState(false)
  const parentCandidates = useMemo(
    () =>
      filterTree(menuMgr.menus, (node) => !menuMgr.excludedIds.has(node.id)),
    [menuMgr.menus, menuMgr.excludedIds],
  )
  const selectedParent = formState.parentId
    ? findMenuNode(menuMgr.allMenus, formState.parentId)
    : null
  // 选中项名称按中文展示；查不到（数据异常）时回退原始 id
  const parentTriggerLabel = selectedParent
    ? menuNameLabel(selectedParent.menuName)
    : formState.parentId

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    if (!validateBeforeSubmit()) return

    const input: MenuInput = {
      menuCode: formState.menuCode.trim(),
      parentMenuId: formState.parentId || undefined,
      menuName: formState.menuName.trim(),
      menuType: formState.menuType,
      menuUrl: formState.menuUrl.trim(),
      imageIcon: formState.imageIcon.trim(),
      seq: Number(formState.seq),
      status: formState.enabled ? 'ENABLED' : 'DISABLED',
    }
    menuMgr.saveMutation.mutate({
      menuId: isCreate ? null : editing.id,
      input,
    })
  }

  return (
    <FormSheet
      open={menuMgr.dialog.open}
      onClose={menuMgr.closeEdit}
      title={title}
      description={
        isButtonForm
          ? '按钮权限维护名称、编码与排序，所属页面与类型由列表入口固定。'
          : '菜单属性以适配前端为准：名称可为中文文案或词条 key，图标填 Lucide 图标名。'
      }
      pending={pendingState}
      onSubmit={submit}
    >
      {!isButtonForm && (
        <FormField label={'父级菜单'} htmlFor="system-menu-parent">
          <Popover
            open={parentPickerOpenState}
            onOpenChange={setParentPickerOpen}
          >
            <PopoverTrigger
              render={
                <Button
                  id="system-menu-parent"
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                />
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                {selectedParent && selectedParent.menuType !== 'BUTTON' && (
                  <MenuNodeIcon
                    menu={{
                      imageIcon: selectedParent.imageIcon,
                      status: selectedParent.status,
                      menuType: selectedParent.menuType,
                    }}
                  />
                )}
                <span className="truncate">
                  {parentTriggerLabel || '根目录'}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            {/* 宽度跟随触发器；高度受限内部滚动，树默认全展开可收起 */}
            <PopoverContent
              className="max-h-72 w-(--anchor-width) overflow-y-auto px-0 py-1.5"
              align="start"
            >
              {/* 根目录行与树行同一套选中/悬停语言，避免两个视觉体系 */}
              <button
                type="button"
                role="treeitem"
                aria-selected={!formState.parentId}
                onClick={() => {
                  setField({ parentId: '' })
                  setParentPickerOpen(false)
                }}
                className={cn(
                  'mb-0.5 flex w-full items-center gap-2 rounded-none px-3 py-1 text-left text-[13px] transition-colors hover:bg-accent/70',
                  !formState.parentId &&
                    'bg-primary/10 font-medium text-primary',
                )}
              >
                <span className="inline-flex size-4.5 shrink-0 items-center justify-center text-amber-600 dark:text-amber-400">
                  <Folder className="size-4 shrink-0" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1 truncate">{'根目录'}</span>
                {!formState.parentId && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </button>
              <MenusTree
                menus={parentCandidates}
                selectedId={formState.parentId}
                showButtonCount={false}
                showSelectedCheck
                compact
                onSelect={(menu) => {
                  setField({ parentId: menu.id })
                  setParentPickerOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </FormField>
      )}
      <FormField
        label={'菜单编码'}
        htmlFor="system-menu-code"
        hint={!isCreate ? '编码是菜单业务主键，创建后不可修改' : undefined}
        error={errors.menuCode}
        required
      >
        <Input
          {...getFieldProps('menuCode', 'system-menu-code')}
          aria-required={isCreate}
          value={formState.menuCode}
          disabled={!isCreate}
          autoFocus
          onChange={(e) => setField({ menuCode: e.target.value })}
          autoComplete="off"
        />
      </FormField>
      <FormField
        label={isButtonForm ? '权限名称' : '菜单名称'}
        htmlFor="system-menu-name"
        error={errors.menuName}
        required
      >
        <Input
          {...getFieldProps('menuName', 'system-menu-name')}
          aria-required="true"
          value={formState.menuName}
          onChange={(e) => setField({ menuName: e.target.value })}
          autoComplete="off"
        />
      </FormField>
      {!isButtonForm && (
        // 按钮权限只能从按钮权限列表的「添加」入口创建，常规新建不提供 BUTTON
        <FormField label={'菜单类型'} htmlFor="system-menu-type">
          <Select
            value={formState.menuType}
            items={menuTypeOptions}
            onValueChange={(value) =>
              setField({ menuType: value as Menu['menuType'] })
            }
          >
            <SelectTrigger id="system-menu-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {menuTypeOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
      {formState.menuType !== 'BUTTON' && (
        <FormField
          label={'路由地址'}
          htmlFor="system-menu-url"
          error={errors.menuUrl}
          required
        >
          <Input
            {...getFieldProps('menuUrl', 'system-menu-url')}
            aria-required="true"
            value={formState.menuUrl}
            placeholder="/system/menus"
            onChange={(e) => setField({ menuUrl: e.target.value })}
          />
        </FormField>
      )}
      {!isButtonForm && (
        <FormField label={'图标'} htmlFor="system-menu-icon">
          <MenuIconPicker
            id="system-menu-icon"
            value={formState.imageIcon}
            onChange={(imageIcon) => setField({ imageIcon })}
          />
        </FormField>
      )}
      <FormField
        label={'排序'}
        htmlFor="system-menu-seq"
        error={errors.seq}
        required
      >
        <Input
          {...getFieldProps('seq', 'system-menu-seq')}
          aria-required="true"
          type="number"
          min={0}
          value={formState.seq}
          onChange={(e) => setField({ seq: e.target.value })}
        />
      </FormField>
      <FormSwitchField
        label={'状态'}
        htmlFor="system-menu-enabled"
        checked={formState.enabled}
        onCheckedChange={(enabled) => setField({ enabled })}
      />
    </FormSheet>
  )
}

/* ------------------------------- 图标选择 ------------------------------- */

/**
 * 菜单图标选择器：输入即筛选，点选后立即预览真实渲染结果。
 *
 * 候选直接用 `lucide-react/dynamic` 的 `iconNames` —— 它就是 `DynamicIcon` 能加载
 * 的全部图标名，与渲染侧同源，因此「能选的」与「能显示的」不会跑偏。
 *
 * 不把上千个图标一次渲染成列表：每项都会实例化一个 `DynamicIcon`，滚动开销过大，
 * 因此限制渲染条数，靠输入缩小范围。
 */
const MAX_VISIBLE = 60

const ICON_NAME_SET = new Set<string>(iconNames)

function MenuIconPicker({
  id,
  value,
  onChange,
}: {
  id: string
  /** 当前值：可能来自接口（PascalCase），也可能是用户输入 */
  value: string
  onChange: (value: string) => void
}) {
  const [openState, setOpen] = useState(false)

  const keyword = value.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!keyword) return iconNames.slice(0, MAX_VISIBLE)
    return iconNames
      .filter((name) => name.includes(keyword))
      .slice(0, MAX_VISIBLE)
  }, [keyword])

  const usable = isIconName(value)

  return (
    <div className="relative">
      <div className="relative">
        <Icon
          name={value}
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          className="pl-8"
          value={value}
          placeholder={'Lucide 图标名，如 Menu'}
          autoComplete="off"
          role="combobox"
          aria-expanded={openState}
          aria-controls={`${id}-options`}
          onFocus={() => setOpen(true)}
          // 失焦延迟关闭，否则点选选项时列表已先被卸载
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
        />
      </div>

      {openState && matches.length > 0 && (
        <div
          id={`${id}-options`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {matches.map((name) => (
            <div key={name}>
              <button
                type="button"
                role="option"
                aria-selected={name === withIconName(value)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-accent aria-selected:bg-accent"
                // 用 mousedown 抢在 input 的 blur 之前，避免列表闪一下就消失
                onMouseDown={(event) => {
                  event.preventDefault()
                  onChange(name)
                  setOpen(false)
                }}
              >
                <Icon
                  name={name}
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{name}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {keyword && !usable && ICON_NAME_SET.has(withIconName(keyword)) && (
        <p className="mt-1 text-[12px] text-muted-foreground">
          {'该名称不在可渲染图标中，侧边栏会显示默认图标（List）'}
        </p>
      )}
    </div>
  )
}
