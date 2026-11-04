import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { EnabledStatusBadge } from '@/components/system/table-parts'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { RoleBadge } from './user-display'
import type { UsersSyncState } from './use-users-sync'

/** 描述表格的行数据 */
interface DetailRowData {
  label: string
  value?: string | null
}

/** 分组标题：弱化小字，配合分隔线划分信息区 */
function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[12px] font-medium tracking-wide text-muted-foreground">
      {children}
    </h3>
  )
}

/** 描述表格：左标签列灰底 + 右值列，外框圆角、行间分隔线；取值缺省显示 — */
function DetailTable({ rows }: { rows: DetailRowData[] }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full border-collapse text-[13px]">
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label} className={cn(index > 0 && 'border-t')}>
              <th
                scope="row"
                className="w-28 shrink-0 border-r bg-muted/40 px-3 py-2 text-left align-top font-normal text-muted-foreground"
              >
                {row.label}
              </th>
              <td className="px-3 py-2 align-top break-all">
                {row.value || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * 只读详情抽屉：点击表格里的账号打开。
 * 顶部为身份块（头像/昵称/账号/角色与状态徽标），下方按基本信息与账号信息分组展示。
 */
export function UserDetailDrawer({ usersSync }: { usersSync: UsersSyncState }) {
  const { t } = useTranslation()
  const user = usersSync.detailState

  return (
    <Sheet
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) usersSync.closeDetail()
      }}
    >
      <SheetContent
        side="right"
        className="flex min-h-0 flex-col gap-0 p-4 sm:max-w-md"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              {user?.avatar && (
                <AvatarImage src={user.avatar} alt={user.username} />
              )}
              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                {(user?.nickname ?? user?.username ?? '—')[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="text-[15px]">
                {user?.nickname ?? user?.username}
              </SheetTitle>
              <SheetDescription className="truncate">
                @{user?.username}
              </SheetDescription>
            </div>
          </div>
          {/* 角色与状态徽标 */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {user?.roles.map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
            <EnabledStatusBadge enabled={user?.enabled ?? false} />
          </div>
        </SheetHeader>
        {user && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-2">
            <section className="flex flex-col gap-2">
              <SectionTitle>基本信息</SectionTitle>
              <DetailTable
                rows={[
                  { label: t('system.user.email'), value: user.email },
                  { label: t('system.user.phone'), value: user.phone },
                  { label: t('system.user.dept'), value: user.deptName },
                  { label: t('system.user.job'), value: user.job },
                  { label: t('system.user.signature'), value: user.signature },
                ]}
              />
            </section>
            <section className="flex flex-col gap-2">
              <SectionTitle>账号信息</SectionTitle>
              <DetailTable
                rows={[
                  {
                    label: t('system.user.registerTime'),
                    value: formatDateTime(user.registerTime),
                  },
                ]}
              />
            </section>
          </div>
        )}
        <SheetFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={usersSync.closeDetail}>
            {t('common.close')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
