'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitSingleBid } from '@/lib/actions/bid'
import { FileText } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { BidConditionFields, type BidContext } from '@/components/bid-condition-fields'

type Item = {
  id: string
  substance_name: string
  cas_number: string | null
  qty: number
  unit: string | null
  purity: string | null
  volume: string | null
}

type Props = {
  requestId: string
  items: Item[]
  bidContext: BidContext
}

export function SingleBidForm({ requestId, items, bidContext }: Props) {
  const t = useT()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    formData.set('requestId', requestId)
    setError('')
    startTransition(async () => {
      const result = await submitSingleBid(formData)
      if (result?.error) setError(result.error)
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      {/* Item preview */}
      {items.map(item => (
        <div key={item.id} className="rounded-lg border border-border divide-y divide-border mb-6">
          <div className="flex gap-4 px-4 py-3">
            <span className="w-24 shrink-0 text-sm text-muted-foreground">{t('bid.substanceName')}</span>
            <span className="text-sm font-medium">{item.substance_name}</span>
          </div>
          {item.cas_number && (
            <div className="flex gap-4 px-4 py-3">
              <span className="w-24 shrink-0 text-sm text-muted-foreground">{t('bid.cas')}</span>
              <span className="text-sm font-mono">{item.cas_number}</span>
            </div>
          )}
          <div className="flex gap-4 px-4 py-3">
            <span className="w-24 shrink-0 text-sm text-muted-foreground">{t('bid.qty')}</span>
            <span className="text-sm">{item.qty} {item.unit}</span>
          </div>
          {item.purity && (
            <div className="flex gap-4 px-4 py-3">
              <span className="w-24 shrink-0 text-sm text-muted-foreground">{t('bid.purity')}</span>
              <span className="text-sm">{item.purity}</span>
            </div>
          )}
        </div>
      ))}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {t('bid.totalPrice')} <span className="text-destructive">*</span>
            <span className="text-xs font-normal text-muted-foreground ml-1">{t('bid.totalPriceHint')}</span>
          </label>
          <Input
            type="number"
            name="totalPrice"
            min={1}
            {...{'placeholder': t('bid.totalPricePh')}}
            required
            className="max-w-xs"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('bid.deliveryDate')}</label>
          <Input type="date" name="deliveryDate" min={today} className="max-w-xs" />
        </div>

        {/* 조건 명시: 해외/장비 데모/시약 샘플 */}
        <BidConditionFields ctx={bidContext} />

        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('bid.memo')}</label>
          <Input name="memo" {...{'placeholder': t('bid.memoPh')}} />
        </div>

        {/* 공급사 양식 견적서 PDF — 필수 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {t('bid.quotePdf')} <span className="text-destructive">*</span>
          </label>
          <Input
            type="file"
            name="quotePdf"
            accept="application/pdf"
            required
            className="max-w-md cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('bid.quotePdfHint')}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* SDS 제공 의무 안내 */}
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          <FileText className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <p className="leading-snug">
            <span className="font-semibold text-foreground">{t('bid.sdsTitle')}</span><br />
            {t('bid.sdsBody')}
          </p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? t('bid.submitting') : t('bid.submit')}
          </Button>
        </div>
      </form>
    </>
  )
}
