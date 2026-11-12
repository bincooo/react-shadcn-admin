import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { Button } from '@repo/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet'
import { StatusBadge } from '@/components/common/status-badge'
import { RoleBadges } from './table'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import type { UserState } from './use-user'

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

/** 描述表格：左标签列灰底 + 右值列，直角外框、行间分隔线；取值缺省显示 — */
function DetailTable({ rows }: { rows: DetailRowData[] }) {
  return (
    <div className="overflow-hidden border">
      <table className="w-full border-collapse text-[13px]">
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label} className={cn(index > 0 && 'border-t')}>
              <th
                scope="row"
                className="w-28 shrink-0 border-r bg-muted/40 px-3 py-2 text-right align-top font-normal text-muted-foreground"
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
export function UserDetailDrawer({ userMgr }: { userMgr: UserState }) {
  const user = userMgr.detail

  return (
    <Sheet
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) userMgr.closeDetail()
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
            {user && <RoleBadges codes={user.roles} names={user.roleNames} />}
            <StatusBadge enabled={user?.enabled ?? false} />
          </div>
        </SheetHeader>
        {user && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-2">
            <section className="flex flex-col gap-2">
              <SectionTitle>{'基本信息'}</SectionTitle>
              <DetailTable
                rows={[
                  { label: '邮箱', value: user.email },
                  { label: '手机号', value: user.phone },
                  { label: '部门', value: user.deptName },
                  { label: '职位', value: user.job },
                  { label: '签名', value: user.signature },
                ]}
              />
            </section>
            <section className="flex flex-col gap-2">
              <SectionTitle>{'账号信息'}</SectionTitle>
              <DetailTable
                rows={[
                  {
                    label: '注册时间',
                    value: formatDateTime(user.registerTime),
                  },
                ]}
              />
            </section>
          </div>
        )}
        <SheetFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={userMgr.closeDetail}>
            {'关闭'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
