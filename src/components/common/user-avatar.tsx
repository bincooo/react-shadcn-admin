import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

/**
 * 当前登录用户的头像：优先展示用户头像，未填写或图片加载失败时回退姓名首字。
 * 顶栏与侧边栏共用。
 */
export function UserAvatar({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user)
  const name = user?.name ?? 'A'

  return (
    <Avatar className={cn('size-8 shrink-0', className)}>
      {user?.avatar && <AvatarImage src={user.avatar} alt={name} />}
      <AvatarFallback className="bg-primary/15 text-[12px] font-semibold text-primary">
        {name[0]}
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * 数据行的占位头像（订单行 / 用户列表等使用）。
 * 传入 `src` 时优先展示图片，加载失败或未传时回退到名字首字。
 */
export function NameAvatar({
  name,
  src,
  className,
}: {
  name: string
  src?: string
  className?: string
}) {
  return (
    <Avatar className={cn('size-7', className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
        {name[0]}
      </AvatarFallback>
    </Avatar>
  )
}
