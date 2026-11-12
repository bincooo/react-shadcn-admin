import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle, Mail, RefreshCw, UserRound } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Skeleton } from '@repo/ui/components/skeleton'
import { Textarea } from '@repo/ui/components/textarea'
import { useFormValidation } from '@/hooks/use-form-validation'
import {
  updateProfile,
  type ProfileData,
  type ProfileUpdateInput,
} from '@/api/profile'
import { errorMessage } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import type { ProfilePreview } from './card'

/* ------------------------------- 表单字段 ------------------------------- */

function ProfileInputField({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-[12.5px] font-normal text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}

interface ProfileFormState {
  nickname: string
  sex: string
  signature: string
  email: string
  phone: string
  job: string
}

const SEX_UNSET = 'unset'

function withFormState(profile: ProfileData): ProfileFormState {
  return {
    nickname: profile.userName,
    sex: profile.sex ?? '',
    signature: profile.signature ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    job: profile.job ?? '',
  }
}

function withUpdateInput(
  form: ProfileFormState,
  profile: ProfileData,
): ProfileUpdateInput {
  const text = (value: string) => value.trim() || undefined
  return {
    userName: form.nickname.trim() || '',
    avatar: profile.avatar ?? undefined,
    sex: text(form.sex),
    signature: text(form.signature),
    email: text(form.email),
    phone: text(form.phone),
    job: text(form.job),
  }
}

function validateProfile(
  form: ProfileFormState,
): Partial<Record<keyof ProfileFormState, string>> {
  const errors: Partial<Record<keyof ProfileFormState, string>> = {}
  const email = form.email.trim()
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'system.user.error.email'
  }
  return errors
}

/**
 * 账号档案表单：联系方式与个人资料可编辑；组织 / 账号标识只读。
 */
export function ProfileForm({
  profile,
  onPreviewChange,
}: {
  profile: ProfileData
  onPreviewChange?: (preview: ProfilePreview) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [formState, setForm] = useState<ProfileFormState>(() =>
    withFormState(profile),
  )

  useEffect(() => {
    const next = withFormState(profile)
    setForm(next)
    onPreviewChange?.({
      nickname: next.nickname,
      signature: next.signature,
    })
  }, [profile, onPreviewChange])

  const { errors, validateBeforeSubmit, getFieldProps } = useFormValidation(
    formState,
    validateProfile,
  )

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast.success(t('profile.saved'))
      queryClient.setQueryData(['profile'], data)
      useAuthStore.getState().updateUser({
        name: data.userName,
        email: data.email ?? '',
        avatar: data.avatar ?? '',
      })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const setField = (changes: Partial<ProfileFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...changes }
      onPreviewChange?.({
        nickname: next.nickname,
        signature: next.signature,
      })
      return next
    })
  }

  const dirty =
    JSON.stringify(formState) !== JSON.stringify(withFormState(profile))
  const pendingState = saveMutation.isPending

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState || !dirty) return
    if (!validateBeforeSubmit()) return
    saveMutation.mutate(withUpdateInput(formState, profile))
  }

  const sexItems = [
    { value: SEX_UNSET, label: t('profile.sexUnset') },
    { value: '男', label: t('profile.sexMale') },
    { value: '女', label: t('profile.sexFemale') },
  ]

  return (
    <Card className={cn('gap-0 py-0', 'flex min-h-0 flex-col')}>
      <CardHeader className="gap-1 px-6 pt-5 pb-4">
        <CardTitle className="text-[15px]">
          {t('profile.recordTitle')}
        </CardTitle>
        <CardDescription className="text-[12.5px]">
          {t('profile.recordDesc')}
        </CardDescription>
      </CardHeader>
      <form
        noValidate
        onSubmit={submit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col gap-4 px-6 py-5">
          <section>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <UserRound className="size-3.5" />
              </span>
              <h3 className="text-[13px] font-medium">
                {t('profile.personal')}
              </h3>
            </div>
            <div className="grid gap-x-6 gap-y-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
              <ProfileInputField
                label={t('profile.nickname')}
                htmlFor="profile-nickname"
              >
                <Input
                  id="profile-nickname"
                  value={formState.nickname}
                  onChange={(e) => setField({ nickname: e.target.value })}
                />
              </ProfileInputField>
              <ProfileInputField label={t('profile.sex')} htmlFor="profile-sex">
                <Select
                  value={formState.sex || SEX_UNSET}
                  items={sexItems}
                  onValueChange={(value) =>
                    setField({
                      sex: !value || value === SEX_UNSET ? '' : value,
                    })
                  }
                >
                  <SelectTrigger id="profile-sex" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sexItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ProfileInputField>
              <ProfileInputField label={t('profile.job')} htmlFor="profile-job">
                <Input
                  id="profile-job"
                  value={formState.job}
                  onChange={(e) => setField({ job: e.target.value })}
                />
              </ProfileInputField>
              <ProfileInputField
                className="sm:col-span-2"
                label={t('profile.signature')}
                htmlFor="profile-signature"
              >
                <Textarea
                  id="profile-signature"
                  rows={3}
                  value={formState.signature}
                  onChange={(e) => setField({ signature: e.target.value })}
                />
              </ProfileInputField>
            </div>
          </section>
          <section>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-info/10 text-info">
                <Mail className="size-3.5" />
              </span>
              <h3 className="text-[13px] font-medium">
                {t('profile.contact')}
              </h3>
            </div>
            <div className="grid gap-x-6 gap-y-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
              <ProfileInputField
                label={t('profile.email')}
                htmlFor="profile-email"
                error={errors.email ? t(errors.email) : undefined}
              >
                <Input
                  {...getFieldProps('email', 'profile-email')}
                  type="email"
                  value={formState.email}
                  onChange={(e) => setField({ email: e.target.value })}
                />
              </ProfileInputField>
              <ProfileInputField
                label={t('profile.phone')}
                htmlFor="profile-phone"
              >
                <Input
                  id="profile-phone"
                  value={formState.phone}
                  onChange={(e) => setField({ phone: e.target.value })}
                />
              </ProfileInputField>
            </div>
          </section>
        </div>
        <div className="mt-auto flex justify-end gap-2 border-t bg-muted/20 px-6 py-3.5">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || pendingState}
            onClick={() => {
              const next = withFormState(profile)
              setForm(next)
              onPreviewChange?.({
                nickname: next.nickname,
                signature: next.signature,
              })
            }}
          >
            {t('common.reset')}
          </Button>
          <Button type="submit" disabled={!dirty || pendingState}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/* ------------------------------ 加载 / 失败 ------------------------------ */

export function ProfileSkeleton() {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)]">
      <Card className="gap-0 py-0">
        <Skeleton className="h-28 w-full rounded-none" />
        <CardContent className="-mt-10 space-y-3 px-5 pb-5">
          <Skeleton className="size-[4.5rem] rounded-full ring-4 ring-card" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
      <Card className="gap-0 py-0">
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
    <Card className="gap-0 py-0">
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
