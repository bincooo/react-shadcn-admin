import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { cn } from '@/lib/utils'

/**
 * 当前登录用户的头像：优先展示用户头像，未填写或图片加载失败时回退姓名首字。
 * 顶栏与侧边栏共用。
 */
export function UserAvatar({
  name,
  avatar,
  className,
}: {
  name: string
  avatar?: string
  className?: string
}) {
  return (
    <Avatar className={cn('size-8 shrink-0', className)}>
      {avatar && <AvatarImage src={avatar} alt={name} />}
      <AvatarFallback className="bg-primary/15 text-[12px] font-semibold text-primary">
        {name[0]}
      </AvatarFallback>
    </Avatar>
  )
}
