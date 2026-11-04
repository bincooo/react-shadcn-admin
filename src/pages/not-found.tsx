import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="bg-linear-to-b from-foreground to-foreground/40 bg-clip-text text-[76px] leading-none font-bold text-transparent">
        404
      </p>
      <p className="text-sm text-muted-foreground">{t('page.notFound')}</p>
      <Button asChild className="mt-2">
        <Link to="/dashboard">{t('common.backHome')}</Link>
      </Button>
    </div>
  )
}
