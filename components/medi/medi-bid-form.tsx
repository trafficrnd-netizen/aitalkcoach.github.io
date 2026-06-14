'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createMediBid } from '@/lib/actions/medi-bid'
import { useT } from '@/lib/i18n/context'
import { CheckCircle2, SendHorizontal } from 'lucide-react'

type Props = {
  requestId: string
  requestTitle: string
}

export function MediBidForm({ requestId, requestTitle }: Props) {
  const t = useT()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    formData.set('requestId', requestId)
    setError('')
    startTransition(async () => {
      const result = await createMediBid(formData)
      if (result?.error) setError(result.error)
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{requestTitle}</span>에 견적을 제출합니다.
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          {t('medi.bid.totalPrice')} <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-2">
          <Input
            name="totalPrice"
            type="number"
            min={1}
            placeholder="0"
            required
            className="max-w-[200px]"
          />
          <span className="text-sm text-muted-foreground">{t('medi.bid.won')}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">{t('medi.bid.totalPriceHint')}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t('medi.bid.deliveryDate')}</label>
        <Input
          name="deliveryDate"
          type="date"
          min={today}
          className="max-w-[200px]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t('medi.bid.memo')}</label>
        <textarea
          name="memo"
          rows={3}
          placeholder={t('medi.bid.memoPh')}
          className="flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-xs text-emerald-700 font-medium">{t('medi.bid.freeBadge')}</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full gap-2">
        <SendHorizontal className="h-4 w-4" />
        {isPending ? t('common.loading') : t('medi.bid.submit')}
      </Button>
    </form>
  )
}
