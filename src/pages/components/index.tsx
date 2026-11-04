import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { CircleAlert, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SectionCard } from '@/components/common/section-card'
import { Spinner } from '@/components/ui/spinner'
import { DetailRow } from '@/components/common/detail-row'
import { SelectDemo } from './select-demo'

/** 示例卡片内容区的统一纵向间距（12 处复用） */
const CARD_STACK = 'flex flex-col gap-5'

/** 演示行的标签列宽 */
const DEMO_LABEL_WIDTH = '180px'

const AVATAR_DEMOS = [
  {
    label: 'A',
    avatarClassName: 'size-8',
    fallbackClassName: 'bg-primary/10 text-[11px] text-primary',
  },
  {
    label: 'B',
    avatarClassName: 'size-10',
    fallbackClassName: 'bg-success/10 text-[12px] text-success',
  },
  {
    label: 'C',
    avatarClassName: 'size-12',
    fallbackClassName: 'bg-warning/10 text-[14px] text-warning',
  },
]

export default function Components() {
  const { t } = useTranslation()
  const [sliderState, setSlider] = useState(35)
  const [dialogOpenState, setDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base">{t('page.tabBase')}</TabsTrigger>
          <TabsTrigger value="feedback">{t('page.tabFeedback')}</TabsTrigger>
          <TabsTrigger value="overlay">{t('page.tabOverlay')}</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard contentClassName={CARD_STACK} title="Button">
              <div className="flex flex-wrap items-center gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="xs">XS</Button>
                <Button size="sm">SM</Button>
                <Button size="default">Default</Button>
                <Button size="lg">LG</Button>
                <Button size="icon" variant="outline" aria-label="icon">
                  <PartyPopper />
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </SectionCard>

            <SectionCard contentClassName={CARD_STACK} title="Badge">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="ghost">Ghost</Badge>
                <Badge variant="link">Link</Badge>
              </div>
            </SectionCard>

            <SectionCard contentClassName={CARD_STACK} title="Input">
              <div className="flex flex-col gap-2">
                <Input placeholder="Input" />
                <Input disabled placeholder="Disabled" />
                <Input aria-invalid defaultValue="Invalid" />
              </div>
            </SectionCard>

            <SectionCard contentClassName={CARD_STACK} title="Select">
              <SelectDemo />
            </SectionCard>

            <SectionCard
              contentClassName={CARD_STACK}
              title="Switch / Slider / Progress"
            >
              <DetailRow
                labelWidth={DEMO_LABEL_WIDTH}
                title={t('page.switchDemo')}
              >
                <Switch defaultChecked />
              </DetailRow>
              <DetailRow
                labelWidth={DEMO_LABEL_WIDTH}
                title={`Slider (${sliderState})`}
              >
                <Slider
                  value={[sliderState]}
                  min={0}
                  max={100}
                  onValueChange={([v]) => setSlider(v)}
                />
              </DetailRow>
              <DetailRow labelWidth={DEMO_LABEL_WIDTH} title="Progress">
                <Progress value={62} className="h-1.5" />
              </DetailRow>
            </SectionCard>

            <SectionCard contentClassName={CARD_STACK} title="Avatar">
              <div className="flex items-center gap-3">
                {AVATAR_DEMOS.map(
                  ({ label, avatarClassName, fallbackClassName }) => (
                    <Avatar key={label} className={avatarClassName}>
                      <AvatarFallback className={fallbackClassName}>
                        {label}
                      </AvatarFallback>
                    </Avatar>
                  ),
                )}
              </div>
            </SectionCard>

            <SectionCard
              contentClassName={CARD_STACK}
              title={t('page.separatorDemo')}
            >
              <div>
                <p className="text-[13px]">Above</p>
                <Separator className="my-3" />
                <p className="text-[13px]">Below</p>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard contentClassName={CARD_STACK} title="Alert">
              <Alert>
                <CircleAlert />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>
                  An informational message describing the current state.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  The operation failed. Please try again later.
                </AlertDescription>
              </Alert>
            </SectionCard>

            <SectionCard
              contentClassName={CARD_STACK}
              title={t('page.skeletonDemo')}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
            </SectionCard>

            <SectionCard contentClassName={CARD_STACK} title="Spinner">
              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Spinner />
                Loading
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="overlay" className="mt-4">
          <SectionCard contentClassName={CARD_STACK} title="Dialog">
            <Dialog open={dialogOpenState} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">{t('page.openDialog')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{t('page.dialogTitle')}</DialogTitle>
                  <DialogDescription>{t('page.dialogDesc')}</DialogDescription>
                </DialogHeader>
                <p className="text-[13px] text-muted-foreground">
                  {t('page.dialogBody')}
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>
                    {t('common.confirm')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
