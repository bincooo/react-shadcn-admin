import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABEL_KEYS } from './use-users-sync'

/** 角色徽标：admin 用主色，其余用次要色 */
export function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation()
  const key = ROLE_LABEL_KEYS[role]

  return (
    <Badge
      variant={role === 'admin' ? 'default' : 'secondary'}
      className="text-[11px]"
    >
      {key ? t(key) : role}
    </Badge>
  )
}
