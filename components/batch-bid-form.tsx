'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { submitBatchBid, type BidItemInput } from '@/lib/actions/bid'
import {
  downloadSupplierQuoteTemplate,
  parseSupplierQuoteExcel,
  type SupplierQuoteRequestItem,
} from '@/lib/excel-templates'
import { FileText, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { BidConditionFields, type BidContext } from '@/components/bid-condition-fields'

type RequestItem = SupplierQuoteRequestItem & { purity: string | null }

type Props = {
  requestId: string
  items: RequestItem[]
  requestTitle?: string
  bidContext: BidContext
}

export function BatchBidForm({ requestId, items, requestTitle = '묶음 견적 요청', bidContext }: Props) {
  const [bidItems, setBidItems] = useState<BidItemInput[]>(
    items.map(item => ({ requestItemId: item.id, totalPrice: 0, available: true }))
  )
  const [deliveryDate, setDeliveryDate] = useState('')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Excel quote upload state
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const quoteFileRef = useRef<HTMLInputElement>(null)

  function toggleAvailable(idx: number, checked: boolean) {
    setBidItems(prev => prev.map((b, i) => i === idx ? { ...b, available: checked, totalPrice: checked ? b.totalPrice : 0 } : b))
  }

  function setPrice(idx: number, value: string) {
    setBidItems(prev => prev.map((b, i) => i === idx ? { ...b, totalPrice: Number(value) || 0 } : b))
  }

  async function handleQuoteUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadMsg(null)
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const result = await parseSupplierQuoteExcel(file)
      setBidItems(prev => prev.map((b, i) => {
        const row = result.bidItems.find(r => r.index === i)
        if (!row) return b
        return { ...b, totalPrice: row.totalPrice, available: row.available }
      }))
      if (result.deliveryDate) setDeliveryDate(result.deliveryDate)
      if (result.memo) setMemo(result.memo)
      setUploadMsg({ type: 'ok', text: `${result.bidItems.filter(r => r.available).length}개 품목 가격이 자동 입력되었습니다.` })
    } catch (err) {
      setUploadMsg({ type: 'err', text: err instanceof Error ? err.message : '파일 파싱 오류' })
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    // 조건 필드(해외/데모/샘플)를 FormData에서 수집
    const fd = new FormData(e.currentTarget)
    const conditions = {
      leadTimeDays: (fd.get('leadTimeDays') as string) || '',
      customsDutyIncluded: (fd.get('customsDutyIncluded') as string) || '',
      certResponsibilityAck: fd.get('certResponsibilityAck') === 'true',
      demoAvailable: (fd.get('demoAvailable') as string) || '',
      demoDays: (fd.get('demoDays') as string) || '',
      sampleAvailable: (fd.get('sampleAvailable') as string) || '',
      conditionsNote: (fd.get('conditionsNote') as string) || '',
    }
    const quoteFile = fd.get('quotePdf') as File | null
    if (!quoteFile || !quoteFile.size) {
      setError('공급사 양식의 견적 PDF를 첨부해주세요.')
      return
    }
    startTransition(async () => {
      const result = await submitBatchBid(requestId, bidItems, { deliveryDate, memo, ...conditions }, quoteFile)
      if (result?.error) setError(result.error)
    })
  }

  const selectedCount = bidItems.filter(b => b.available).length
  const totalPrice = bidItems.filter(b => b.available).reduce((s, b) => s + b.totalPrice, 0)
  const isPartial = selectedCount < items.length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Excel 견적서 다운로드 / 업로드 */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Excel 견적서 작성 (선택)</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadSupplierQuoteTemplate(items, requestTitle)}
          >
            <Download className="h-4 w-4 mr-1.5" />
            견적서 양식 다운로드
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => quoteFileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            작성된 견적서 업로드
          </Button>
        </div>
        <input
          ref={quoteFileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleQuoteUpload}
        />
        {uploadMsg && (
          <div className={`flex items-center gap-2 text-xs rounded-md px-3 py-2 ${
            uploadMsg.type === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {uploadMsg.type === 'ok'
              ? <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
            {uploadMsg.text}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground leading-snug">
          양식 다운로드 → 단가·납기가능일 작성 → 업로드하면 아래 가격이 자동 입력됩니다.
          업로드 후 수동으로 수정할 수 있습니다.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">품목별 가격 입력</h2>
          <span className="text-xs text-muted-foreground">
            {selectedCount}/{items.length}개 품목 선택
            {isPartial && <span className="ml-1 text-amber-600">(부분 견적)</span>}
          </span>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium w-8">공급</th>
                <th className="px-3 py-2.5 text-left font-medium">물질명</th>
                <th className="px-3 py-2.5 text-left font-medium hidden sm:table-cell">CAS / 수량</th>
                <th className="px-3 py-2.5 text-right font-medium">견적 금액 (원, VAT포함)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, idx) => {
                const bid = bidItems[idx]
                return (
                  <tr key={item.id} className={!bid.available ? 'opacity-50' : ''}>
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={bid.available}
                        onCheckedChange={(c) => toggleAvailable(idx, Boolean(c))}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{item.substance_name}</div>
                      {item.purity && <div className="text-xs text-muted-foreground">{item.purity}</div>}
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                      <div className="font-mono">{item.cas_number ?? '—'}</div>
                      <div>{item.qty} {item.unit}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={bid.totalPrice || ''}
                        onChange={e => setPrice(idx, e.target.value)}
                        disabled={!bid.available}
                        className="text-right w-32 ml-auto"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {selectedCount > 0 && (
              <tfoot className="bg-muted/30 border-t border-border">
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-sm font-medium text-right pr-4">합계</td>
                  <td className="px-3 py-2.5 text-right font-bold text-primary">
                    {totalPrice.toLocaleString()}원
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {isPartial && (
          <p className="mt-2 text-xs text-amber-700">
            일부 품목만 선택한 부분 견적입니다. 연구자가 품목별로 다른 공급자를 선택할 수 있습니다.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block">납기 가능일</label>
          <Input
            type="date"
            value={deliveryDate}
            onChange={e => setDeliveryDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">메모 (선택)</label>
          <Input
            placeholder="배송 조건, CoA 포함 여부 등"
            value={memo}
            onChange={e => setMemo(e.target.value)}
          />
        </div>
      </div>

      {/* 조건 명시: 해외/장비 데모/시약 샘플 */}
      <BidConditionFields ctx={bidContext} />

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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 ? (
            <span>선택 {selectedCount}개 · 합계 <strong className="text-foreground">{totalPrice.toLocaleString()}원</strong></span>
          ) : '품목을 선택하세요'}
        </div>
        <Button type="submit" disabled={isPending || selectedCount === 0}>
          {isPending ? '제출 중...' : '견적 제출'}
        </Button>
      </div>
    </form>
  )
}
