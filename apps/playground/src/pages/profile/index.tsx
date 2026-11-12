import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Header } from '@/components/common/header'
import { Button } from '@repo/ui/components/button'
import { fetchProfile } from '@/api/profile'
import { cn } from '@/lib/utils'
import { ProfileIdentity, type ProfilePreview } from './modules/card'
import { ProfileError, ProfileForm, ProfileSkeleton } from './modules/form'

/**
 * 个人中心：展示并修改当前登录账号的档案。
 *
 * 数据来自 `GET /api/auth/getUserInfo`，保存走 `PUT /api/auth/profile`。
 */
export default function ProfilePage() {
  const { t } = useTranslation()
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 30_000,
  })
  const profile = profileQuery.data
  const [previewState, setPreview] = useState<ProfilePreview | null>(null)
  const onPreviewChange = useCallback((preview: ProfilePreview) => {
    setPreview(preview)
  }, [])

  let content: ReactNode
  if (profileQuery.isPending) {
    content = <ProfileSkeleton />
  } else if (profileQuery.isError || !profile) {
    content = <ProfileError onRetry={() => profileQuery.refetch()} />
  } else {
    content = (
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)]">
        <ProfileIdentity profile={profile} preview={previewState} />
        <ProfileForm profile={profile} onPreviewChange={onPreviewChange} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <Header
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
