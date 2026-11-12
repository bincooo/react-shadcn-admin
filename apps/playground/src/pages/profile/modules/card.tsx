import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, CalendarDays, Camera, IdCard, Quote } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Card } from '@repo/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import {
  updateProfile,
  type ProfileData,
  type ProfileUpdateInput,
} from '@/api/profile'
import { errorMessage, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

/** 右侧表单正在编辑的展示字段，左侧身份卡即时预览 */
export interface ProfilePreview {
  nickname: string
  signature: string
}

/* ------------------------------- 头像上传 ------------------------------- */

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function withUpdateInputFromProfile(
  profile: ProfileData,
  avatar: string | null,
): ProfileUpdateInput {
  return {
    userName: profile.userName,
    avatar: avatar ?? undefined,
    sex: profile.sex,
    signature: profile.signature,
    email: profile.email,
    phone: profile.phone,
    job: profile.job,
  }
}

/** 头像上传弹窗：本地预览 → 保存档案，成功后同步 query cache 与登录态。 */
function AvatarUploadDialog({
  profile,
  open,
  onOpenChange,
}: {
  profile: ProfileData
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [draftState, setDraft] = useState<string | null>(profile.avatar ?? null)
  const displayName = profile.userName || profile.username

  useEffect(() => {
    if (open) setDraft(profile.avatar ?? null)
  }, [open, profile.avatar])

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast.success(t('profile.saved'))
      queryClient.setQueryData(['profile'], data)
      useAuthStore.getState().updateUser({ avatar: data.avatar ?? '' })
      onOpenChange(false)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatarInvalid'))
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(t('profile.avatarTooLarge'))
      return
    }
    try {
      setDraft(await readImageFile(file))
    } catch {
      toast.error(t('profile.avatarInvalid'))
    }
  }

  const dirty = draftState !== (profile.avatar ?? null)
  const pendingState = saveMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('profile.changeAvatar')}</DialogTitle>
          <DialogDescription>{t('profile.avatarHint')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-1">
          <button
            type="button"
            className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={t('profile.uploadAvatar')}
            onClick={() => fileRef.current?.click()}
          >
            <Avatar className="size-24">
              {draftState && <AvatarImage src={draftState} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-[28px] font-semibold text-primary">
                {displayName.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="sr-only"
            onChange={pickFile}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              {t('profile.uploadAvatar')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!draftState}
              onClick={() => setDraft(null)}
            >
              {t('profile.removeAvatar')}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={!dirty || pendingState}
            onClick={() =>
              saveMutation.mutate(
                withUpdateInputFromProfile(profile, draftState),
              )
            }
          >
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------- 身份卡 ------------------------------- */

/**
 * 身份卡：头像、展示名、账号、角色与签名。
 * 注册时间与账号状态收在底部，作为档案的可核对信息。
 */
export function ProfileIdentity({
  profile,
  preview,
}: {
  profile: ProfileData
  preview?: ProfilePreview | null
}) {
  const { t } = useTranslation()
  const displayName =
    preview?.nickname.trim() || profile.userName || profile.username
  const signature = preview
    ? preview.signature.trim()
    : (profile.signature ?? '')
  const [avatarOpenState, setAvatarOpen] = useState(false)

  const meta = [
    {
      icon: Building2,
      label: t('profile.dept'),
      value: profile.deptName,
    },
    {
      icon: IdCard,
      label: t('profile.username'),
      value: profile.username,
    },
    {
      icon: CalendarDays,
      label: t('profile.registerTime'),
      value: formatDate(profile.registerTime),
    },
  ]

  return (
    <Card className={cn('gap-0 py-0', 'flex h-full flex-col overflow-hidden')}>
      <div className="relative isolate h-28 overflow-hidden bg-gradient-to-br from-primary via-primary to-info">
        <span className="pointer-events-none absolute -top-8 -right-6 size-36 rounded-full bg-white/15" />
        <span className="pointer-events-none absolute top-8 -left-10 size-24 rounded-full bg-black/10" />
        <span className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgb(255_255_255_/_18%)_1px,transparent_0)] [background-size:14px_14px]" />
      </div>

      <div className="relative flex flex-1 flex-col">
        <div className="-mt-10 px-5">
          <button
            type="button"
            className="relative rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={t('profile.changeAvatar')}
            onClick={() => setAvatarOpen(true)}
          >
            <Avatar className="size-[4.5rem] ring-4 ring-card">
              {profile.avatar && (
                <AvatarImage src={profile.avatar} alt={displayName} />
              )}
              <AvatarFallback className="bg-primary/10 text-[22px] font-semibold text-primary">
                {displayName.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute right-0 bottom-0 grid size-6 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
              <Camera className="size-3" />
            </span>
          </button>
        </div>
        <AvatarUploadDialog
          profile={profile}
          open={avatarOpenState}
          onOpenChange={setAvatarOpen}
        />

        <div className="flex flex-1 flex-col px-5 pt-3 pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[18px] leading-tight font-semibold tracking-tight">
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
                    variant={role === 'admin' ? 'default' : 'secondary'}
                    className="h-5 px-1.5 text-[11px] font-normal"
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

          <div className="mt-4 rounded-xl bg-muted/50 px-3 py-2.5">
            <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Quote className="size-3" />
              {t('profile.signature')}
            </div>
            <p
              className={cn(
                'line-clamp-3 text-[13px] leading-relaxed',
                signature ? 'text-foreground/85' : 'text-muted-foreground',
              )}
            >
              {signature || t('profile.signatureEmpty')}
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {meta.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background text-primary shadow-sm ring-1 ring-border/60">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground">
                      {item.label}
                    </p>
                    <p
                      className={cn(
                        'truncate text-[13px] font-medium',
                        !item.value && 'font-normal text-muted-foreground',
                      )}
                    >
                      {item.value || t('profile.notFilled')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
