'use client'

import { useT } from '@/lib/i18n/context'

export function SiteFooter() {
  const t = useT()
  return (
    <footer className="border-t border-border py-8">
      <div className="container flex flex-col items-center gap-2 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>{t('footer.rights')}</p>
        <div className="flex gap-4">
          <a href="/blog" className="hover:text-foreground transition-colors">
            {t('footer.magazine')}
          </a>
          <a href="/terms" className="hover:text-foreground transition-colors">
            {t('footer.terms')}
          </a>
          <a href="/privacy" className="hover:text-foreground transition-colors">
            {t('footer.privacy')}
          </a>
        </div>
      </div>
    </footer>
  )
}
