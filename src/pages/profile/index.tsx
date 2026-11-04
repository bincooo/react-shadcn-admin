import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/common/header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ProfileError,
  ProfileIdentity,
  ProfileRecord,
  ProfileSkeleton,
} from './modules/profile-sections'
import { useProfile } from './modules/use-profile'

/**
 * 个人中心：展示当前登录账号的身份与档案信息。
 *
 * 数据来自后端 `GET /api/auth/getUserInfo`；页面只读，
 * 资料变更统一走用户管理（由管理员维护）。
 */
export default function ProfilePage() {
  const { t } = useTranslation()
  const profileQuery = useProfile()
  const profile = profileQuery.data

  let content: ReactNode
  if (profileQuery.isPending) {
    content = <ProfileSkeleton />
  } else if (profileQuery.isError || !profile) {
    content = <ProfileError onRetry={() => profileQuery.refetch()} />
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <ProfileIdentity profile={profile} />
        <ProfileRecord profile={profile} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeader
        title={t('menu.profile')}
        description={t('profile.description')}
        actions={
          <Button
            variant="outline"
            disabled={profileQuery.isFetching}
            onClick={() => profileQuery.refetch()}
          >
            <RefreshCw
              data-icon="inline-start"
              className={cn(profileQuery.isFetching && 'animate-spin')}
            />
            {t('common.refresh')}
          </Button>
        }
      />
      {content}
    </div>
  )
}
