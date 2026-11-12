import { useTranslation } from 'react-i18next'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { CircleAlert, PartyPopper } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Badge } from '@repo/ui/components/badge'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert'
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar'
import { Input } from '@repo/ui/components/input'
import { Switch } from '@repo/ui/components/switch'
import { Slider } from '@repo/ui/components/slider'
import { Progress } from '@repo/ui/components/progress'
import { Skeleton } from '@repo/ui/components/skeleton'
import { Separator } from '@repo/ui/components/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog'
import { SectionCard } from '@/components/common/section-card'
import { Spinner } from '@repo/ui/components/spinner'
import { cn } from '@/lib/utils'
import { TableDemo } from './modules/table-demo'
import { TreeTableDemo } from './modules/tree-table-demo'
import { EditableTableDemo } from './modules/editable-table-demo'
import { TreeDemo } from './modules/tree-demo'

interface DetailRowProps {
  /** 左侧标题 */
  title: string
  /** 标题下方的补充说明 */
  description?: string
  /** 标题列宽度（详情页更宽，组件示例更窄） */
  labelWidth?: string
  className?: string
  children: ReactNode
}

/**
 * 左右分栏的详情行：左侧标题（可带描述），右侧内容。
 * 列宽通过 CSS 变量传入，避免为两种宽度各写一套网格类。
 */
function DetailRow({
  title,
  description,
  labelWidth = '200px',
  className,
  children,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        'grid gap-3 md:grid-cols-(--detail-label) md:items-start',
        className,
      )}
      style={{ '--detail-label': labelWidth } as CSSProperties}
    >
      <div>
        <p className="text-[13px] font-medium">{title}</p>
        {description && (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

const FRUITS = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']
const VEGETABLES = ['Carrot', 'Broccoli', 'Spinach']

/** 分组 + 分隔线的下拉示例 */
function SelectDemo() {
  const [valueState, setValue] = useState('Blueberry')
  return (
    <Select value={valueState} onValueChange={(value) => setValue(value ?? '')}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {FRUITS.map((fruit) => (
            <SelectItem key={fruit} value={fruit}>
              {fruit}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          {VEGETABLES.map((vegetable) => (
            <SelectItem key={vegetable} value={vegetable}>
              {vegetable}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/** 演示行的标签列宽 */
const DEMO_LABEL_WIDTH = '180px'

export default function Components() {
  const { t } = useTranslation()
  const [sliderState, setSlider] = useState(35)
  const [dialogOpenState, setDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base">{t('page.tabBase')}</TabsTrigger>
          <TabsTrigger value="feedback">{t('page.tabFeedback')}</TabsTrigger>
          <TabsTrigger value="overlay">{t('page.tabOverlay')}</TabsTrigger>
          <TabsTrigger value="data">{t('page.tabData')}</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard contentClassName="flex flex-col gap-5" title="Button">
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

            <SectionCard contentClassName="flex flex-col gap-5" title="Badge">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="ghost">Ghost</Badge>
                <Badge variant="link">Link</Badge>
              </div>
            </SectionCard>

            <SectionCard contentClassName="flex flex-col gap-5" title="Input">
              <div className="flex flex-col gap-2">
                <Input placeholder="Input" />
                <Input disabled placeholder="Disabled" />
                <Input aria-invalid defaultValue="Invalid" />
              </div>
            </SectionCard>

            <SectionCard contentClassName="flex flex-col gap-5" title="Select">
              <SelectDemo />
            </SectionCard>

            <SectionCard
              contentClassName="flex flex-col gap-5"
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
                  onValueChange={(next) =>
                    setSlider(Array.isArray(next) ? next[0] : next)
                  }
                />
              </DetailRow>
              <DetailRow labelWidth={DEMO_LABEL_WIDTH} title="Progress">
                <Progress
                  value={62}
                  className="*:data-[slot=progress-track]:h-1.5"
                />
              </DetailRow>
            </SectionCard>

            <SectionCard contentClassName="flex flex-col gap-5" title="Avatar">
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-[11px] text-primary">
                    A
                  </AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarFallback className="bg-success/10 text-[12px] text-success">
                    B
                  </AvatarFallback>
                </Avatar>
                <Avatar className="size-12">
                  <AvatarFallback className="bg-warning/10 text-[14px] text-warning">
                    C
                  </AvatarFallback>
                </Avatar>
              </div>
            </SectionCard>

            <SectionCard
              contentClassName="flex flex-col gap-5"
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
            <SectionCard contentClassName="flex flex-col gap-5" title="Alert">
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
              contentClassName="flex flex-col gap-5"
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

            <SectionCard contentClassName="flex flex-col gap-5" title="Spinner">
              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Spinner />
                Loading
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="overlay" className="mt-4">
          <SectionCard contentClassName="flex flex-col gap-5" title="Dialog">
            <Dialog open={dialogOpenState} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button variant="outline" />}>
                {t('page.openDialog')}
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

        <TabsContent value="data" className="mt-4">
          <div className="flex flex-col gap-4">
            <TableDemo />
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <TreeTableDemo />
              <EditableTableDemo />
            </div>
            <TreeDemo />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
