import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProfileData } from '@/api/profile'
import { cn } from '@/lib/utils'

/* ------------------------------ 展示工具 ------------------------------ */

const DATE_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'short',
})

/** 个人资料的卡片外框：去掉 Card 默认纵向间距，由内容自行排布 */
const PROFILE_CARD = 'gap-0 py-0'

/** UTC ISO 时间 → 本地日期（如 2026-11-02），解析失败返回空串 */
function formatDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : DATE_FORMATTER.format(date)
}

/* ------------------------------ 身份卡 ------------------------------ */

/**
 * 身份卡：头像、展示名、账号、角色与签名。
 * 注册时间与账号状态收在底部，作为档案的可核对信息。
 */
export function ProfileIdentity({ profile }: { profile: ProfileData }) {
  const { t } = useTranslation()
  const displayName = profile.userName || profile.username

  return (
    <Card className={cn(PROFILE_CARD, 'h-full')}>
      <div className="flex flex-1 flex-col gap-5 px-5 pt-6 pb-5">
        <div className="flex items-start gap-4">
          <Avatar className="size-18">
            {profile.avatar && (
              <AvatarImage src={profile.avatar} alt={displayName} />
            )}
            <AvatarFallback className="bg-primary/10 text-[26px] font-semibold text-primary">
              {displayName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[19px] leading-tight font-semibold tracking-tight">
                {displayName}
              </h2>
              <Badge
                variant="secondary"
                className={cn(
                  'h-5 shrink-0 px-2 text-[11px]',
                  profile.enabled
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {t(
                  profile.enabled
                    ? 'profile.statusEnabled'
                    : 'profile.statusDisabled',
                )}
              </Badge>
            </div>
            <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
              @{profile.username}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {profile.roles.length > 0 ? (
                profile.roles.map((role) => {
                  const key = `role.${role}`
                  const label = t(key)
                  return (
                    <Badge
                      key={role}
                      variant="outline"
                      className="h-5 px-1.5 text-[11px] text-muted-foreground"
                    >
                      {label === key ? role : label}
                    </Badge>
                  )
                })
              ) : (
                <span className="text-[12px] text-muted-foreground">
                  {t('profile.notFilled')}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="border-l-2 border-primary/35 pl-3 text-[13px] leading-relaxed text-muted-foreground">
          {profile.signature || t('profile.signatureEmpty')}
        </p>
      </div>
      <Separator />
      <dl className="flex items-center justify-between px-5 py-3 text-[12.5px]">
        <dt className="text-muted-foreground">{t('profile.registerTime')}</dt>
        <dd className="tabular-nums">
          {formatDate(profile.registerTime) || t('profile.notFilled')}
        </dd>
      </dl>
    </Card>
  )
}

/* ------------------------------ 档案字段 ------------------------------ */

interface ProfileFieldProps {
  label: string
  /** 服务端字段可能为空，空值统一按「未填写」展示 */
  value: ReactNode
}

function ProfileField({ label, value }: ProfileFieldProps) {
  const { t } = useTranslation()
  const empty = value === null || value === undefined || value === ''

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11.5px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-[13px] break-words',
          empty && 'text-muted-foreground',
        )}
      >
        {empty ? t('profile.notFilled') : value}
      </dd>
    </div>
  )
}

/**
 * 账号档案：按「联系方式 / 组织信息 / 账号信息」分组，
 * 组内两列排布，组间以细线分隔。
 */
export function ProfileRecord({ profile }: { profile: ProfileData }) {
  const { t } = useTranslation()
  const sections = [
    {
      title: t('profile.contact'),
      fields: [
        { label: t('profile.email'), value: profile.email },
        { label: t('profile.phone'), value: profile.phone },
      ],
    },
    {
      title: t('profile.organization'),
      fields: [
        { label: t('profile.dept'), value: profile.deptName },
        { label: t('profile.job'), value: profile.job },
      ],
    },
    {
      title: t('profile.account'),
      fields: [
        { label: t('profile.username'), value: profile.username },
        { label: t('profile.userId'), value: profile.userId },
        { label: t('profile.sex'), value: profile.sex },
      ],
    },
  ]

  return (
    <Card className={PROFILE_CARD}>
      <CardHeader className="gap-1 px-5 pt-5 pb-4">
        <CardTitle className="text-[15px]">
          {t('profile.recordTitle')}
        </CardTitle>
        <CardDescription className="text-[12.5px]">
          {t('profile.recordDesc')}
        </CardDescription>
      </CardHeader>
      <div className="flex flex-col">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className={cn(
              'px-5 py-4',
              index > 0 && 'border-t border-border/70',
            )}
          >
            <h3 className="text-[12px] font-medium text-muted-foreground">
              {section.title}
            </h3>
            <dl className="mt-3 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {section.fields.map((field) => (
                <ProfileField
                  key={field.label}
                  label={field.label}
                  value={field.value}
                />
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Card>
  )
}

/* ------------------------------ 加载 / 失败 ------------------------------ */

export function ProfileSkeleton() {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <Card className={PROFILE_CARD}>
        <CardContent className="flex items-start gap-4 py-6">
          <Skeleton className="size-18 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardContent>
      </Card>
      <Card className={PROFILE_CARD}>
        <CardContent className="flex flex-col gap-3 py-6">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function ProfileError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <Card className={PROFILE_CARD}>
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <AlertCircle
          className="size-8 text-muted-foreground"
          strokeWidth={1.5}
        />
        <div>
          <p className="text-[14px] font-medium">{t('profile.loadFailed')}</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {t('profile.loadFailedDesc')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" />
          {t('profile.retry')}
        </Button>
      </div>
    </Card>
  )
}
