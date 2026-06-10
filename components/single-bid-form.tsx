'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitSingleBid } from '@/lib/actions/bid'
import { FileText } from 'lucide-react'
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
            <span className="w-24 shrink-0 text-sm text-muted-foreground">물질명</span>
            <span className="text-sm font-medium">{item.substance_name}</span>
          </div>
          {item.cas_number && (
            <div className="flex gap-4 px-4 py-3">
              <span className="w-24 shrink-0 text-sm text-muted-foreground">CAS</span>
              <span className="text-sm font-mono">{item.cas_number}</span>
            </div>
          )}
          <div className="flex gap-4 px-4 py-3">
            <span className="w-24 shrink-0 text-sm text-muted-foreground">수량</span>
            <span className="text-sm">{item.qty} {item.unit}</span>
          </div>
          {item.purity && (
            <div className="flex gap-4 px-4 py-3">
              <span className="w-24 shrink-0 text-sm text-muted-foreground">순도</span>
              <span className="text-sm">{item.purity}</span>
            </div>
          )}
        </div>
      ))}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            견적 금액 <span className="text-destructive">*</span>
            <span className="text-xs font-normal text-muted-foreground ml-1">(VAT 포함, 원)</span>
          </label>
          <Input
            type="number"
            name="totalPrice"
            min={1}
            placeholder="예: 87000"
            required
            className="max-w-xs"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">납기 가능일</label>
          <Input type="date" name="deliveryDate" min={today} className="max-w-xs" />
        </div>

        {/* 조건 명시: 해외/장비 데모/시약 샘플 */}
        <BidConditionFields ctx={bidContext} />

        <div>
          <label className="text-sm font-medium mb-1.5 block">메모 (선택)</label>
          <Input name="memo" placeholder="CoA 포함 여부, 냉장 배송 가능 여부 등" />
        </div>

        {/* 공급사 양식 견적서 PDF — 필수 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            견적서 PDF (공급사 양식) <span className="text-destructive">*</span>
          </label>
          <Input
            type="file"
            name="quotePdf"
            accept="application/pdf"
            required
            className="max-w-md cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            자사 양식의 견적서를 PDF로 첨부해주세요. (10MB 이하) 연구자가 비교 단계에서 다운로드합니다.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* SDS 제공 의무 안내 */}
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          <FileText className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <p className="leading-snug">
            <span className="font-semibold text-foreground">SDS 제공 의무 안내 (화평법 제35조)</span><br />
            낙찰 후 납품 시 해당 화학물질의 물질안전보건자료(SDS/MSDS)를 구매자에게 제공해야 합니다.
            유해화학물질 판매업자는 화관법 제28조에 따른 영업허가를 보유해야 합니다.
          </p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '제출 중...' : '견적 제출'}
          </Button>
        </div>
      </form>
    </>
  )
}
