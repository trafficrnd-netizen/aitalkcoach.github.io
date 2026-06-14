'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { BatchItemRow, emptyItem } from '@/components/batch-item-row'
import type { BatchItem } from '@/components/batch-item-row'
import { createBatchRequest } from '@/lib/actions/request'
import { AddressSearch } from '@/components/address-search'
import { ExcelBatchSection } from '@/components/excel-batch-section'
import { PAYMENT_TERMS, paymentTermLabel, type PaymentTermValue } from '@/lib/payment-terms'
import { Plus, Clock, CalendarClock, ShieldCheck, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { checkRegulated } from '@/lib/regulated-substances'

type Step = 'form' | 'preview'
type BidMode = 'open' | 'deadline'

interface Meta {
  title: string
  deadline: string
  deliveryAddress: string
  deliveryCity: string
  paymentTerms: PaymentTermValue | ''
  notes: string
}

const BID_MODE_OPTIONS: { value: BidMode; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    value: 'open',
    icon: <Clock className="h-5 w-5" />,
    label: '선착순형',
    desc: '마감 기한 없이 연구자가 원하는 시점에 직접 낙찰합니다.',
  },
  {
    value: 'deadline',
    icon: <CalendarClock className="h-5 w-5" />,
    label: '기간 마감형',
    desc: '설정한 마감일까지 입찰을 받고 최적 견적을 비교해 선택합니다.',
  },
]

export default function BatchRequestPage() {
  const [step, setStep] = useState<Step>('form')
  const [items, setItems] = useState<BatchItem[]>([emptyItem(), emptyItem()])
  const [meta, setMeta] = useState<Meta>({ title: '', deadline: '', deliveryAddress: '', deliveryCity: '', paymentTerms: '', notes: '' })
  const [bidMode, setBidMode] = useState<BidMode>('open')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateItem(id: string, field: keyof BatchItem, value: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()])
  }

  function addExcelItems(newItems: BatchItem[]) {
    setItems(prev => [...prev, ...newItems])
  }

  function setMetaField(field: keyof Meta) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setMeta(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const valid = items.filter(i => i.substanceName.trim() && Number(i.qty) > 0)
    if (valid.length < 2) {
      setError('품목을 2개 이상 완성해주세요 (물질명 + 수량 필수).')
      return
    }
    if (bidMode === 'deadline' && !meta.deadline) {
      setError('기간 마감형은 입찰 마감일을 입력해주세요.')
      return
    }
    if (!meta.deliveryCity.trim()) {
      setError('배송 도시명을 입력해주세요. (대리점 권역 매칭에 필요합니다)')
      return
    }
    if (!meta.paymentTerms) {
      setError('결제조건을 선택해주세요.')
      return
    }
    setStep('preview')
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const result = await createBatchRequest(items, meta, bidMode)
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
      setStep('form')
    }
  }

  const validItems = items.filter(i => i.substanceName.trim() && Number(i.qty) > 0)
  const bidModeLabel = bidMode === 'open' ? '선착순형 (연구자 직접 마감)' : '기간 마감형'

  // 묶음 품목 중 규제물질 목록
  const regulatedItems = validItems
    .map(i => ({ item: i, reg: checkRegulated(i.casNumber) }))
    .filter(r => r.reg !== null) as { item: typeof validItems[0]; reg: NonNullable<ReturnType<typeof checkRegulated>> }[]
  const hasHighRisk = regulatedItems.some(r => r.reg.level === 'high')

  if (step === 'preview') {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-1">묶음 요청 확인</h1>
        <p className="text-sm text-muted-foreground mb-6">내용을 확인하고 게시하세요.</p>

        <div className="rounded-lg border border-border bg-card divide-y divide-border mb-4">
          {meta.title && <PreviewRow label="요청 제목" value={meta.title} />}
          <PreviewRow label="입찰 방식" value={bidModeLabel} />
          {meta.deadline && (
            <PreviewRow
              label={bidMode === 'deadline' ? '입찰 마감일' : '납기 희망일'}
              value={meta.deadline}
            />
          )}
          {meta.deliveryAddress && <PreviewRow label="배송지" value={meta.deliveryAddress} />}
          {meta.deliveryCity && <PreviewRow label="배송 도시 (권역)" value={meta.deliveryCity} />}
          {meta.paymentTerms && <PreviewRow label="결제조건" value={paymentTermLabel(meta.paymentTerms)} />}
          {meta.notes && <PreviewRow label="추가 요청사항" value={meta.notes} />}
        </div>

        <div className="rounded-lg border border-border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">물질명</th>
                <th className="px-3 py-2 text-left font-medium">CAS</th>
                <th className="px-3 py-2 text-left font-medium">수량</th>
                <th className="px-3 py-2 text-left font-medium">순도</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {validItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 font-medium">{item.substanceName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.casNumber || '—'}</td>
                  <td className="px-3 py-2">{item.qty} {item.unit}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.purity || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground mb-4">총 {validItems.length}개 품목</p>

        {/* 규제물질 경고 */}
        {regulatedItems.length > 0 && (
          <div className={cn(
            'flex items-start gap-2 rounded-md border px-3 py-2.5 mb-4',
            hasHighRisk ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
          )}>
            <ShieldAlert className={cn('h-4 w-4 shrink-0 mt-0.5', hasHighRisk ? 'text-red-600' : 'text-amber-600')} />
            <div className={cn('text-xs leading-snug', hasHighRisk ? 'text-red-800' : 'text-amber-800')}>
              <span className="font-semibold">
                {hasHighRisk ? '⚠️ 고위험 규제물질 포함' : '관리대상 물질 포함'}
              </span>
              <ul className="mt-1 space-y-0.5">
                {regulatedItems.map(({ item, reg }) => (
                  <li key={item.id}>
                    <span className="font-medium">{item.substanceName}</span>
                    {item.casNumber && <span className="font-mono ml-1">({item.casNumber})</span>}
                    {' — '}{reg.regs.join(' · ')}
                    {reg.level === 'high' && <span className="ml-1 font-semibold">고위험</span>}
                  </li>
                ))}
              </ul>
              {hasHighRisk && (
                <p className="mt-1">취급 전 기관 허가 여부를 반드시 확인하세요.</p>
              )}
            </div>
          </div>
        )}

        {/* 비공개 안내 */}
        <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5 mb-4">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-primary leading-snug">
            입찰가와 낙찰가는 거래 당사자 간에만 공유되며, 다른 공급사에 공개되지 않습니다.
          </p>
        </div>

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('form')} disabled={submitting}>수정</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '게시 중...' : '묶음 견적 요청 게시'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">묶음 견적 요청</h1>
      <p className="text-sm text-muted-foreground mb-6">
        여러 품목을 한 번에 요청합니다. 공급자는 전체 또는 일부 품목만 입찰할 수 있습니다.
      </p>

      <form onSubmit={handlePreview} className="space-y-6">
        {/* 품목 목록 */}
        <section className="space-y-3">
          <h2 className="font-semibold">품목 목록 <span className="text-destructive">*</span></h2>

          {/* Excel 일괄 입력 */}
          <ExcelBatchSection onItemsAdd={addExcelItems} />

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">또는 수동 입력</span>
            </div>
          </div>

          {items.map((item, idx) => (
            <BatchItemRow
              key={item.id}
              index={idx}
              item={item}
              onChange={updateItem}
              onRemove={removeItem}
              canRemove={items.length > 2}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> 품목 추가
          </Button>
          <p className="text-xs text-muted-foreground">
            완성된 품목: {validItems.length}개 / 전체: {items.length}개
          </p>
        </section>

        <Separator />

        {/* 입찰 방식 선택 */}
        <section className="space-y-3">
          <h2 className="font-semibold">입찰 방식 <span className="text-destructive">*</span></h2>
          <div className="grid grid-cols-2 gap-3">
            {BID_MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBidMode(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-lg border-2 px-4 py-3 text-left transition-colors',
                  bidMode === opt.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/40 text-foreground'
                )}
              >
                <span className={cn('flex items-center gap-1.5 font-semibold text-sm', bidMode === opt.value ? 'text-primary' : '')}>
                  {opt.icon}
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground leading-snug">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <Separator />

        {/* 공통 정보 */}
        <section className="space-y-4">
          <h2 className="font-semibold">공통 정보</h2>
          <div className="space-y-2">
            <Label htmlFor="title">요청 제목</Label>
            <Input id="title" value={meta.title} onChange={setMetaField('title')} placeholder="예: 2분기 시약 일괄 구매" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">
              {bidMode === 'deadline' ? '입찰 마감일 *' : '납기 희망일 (선택)'}
            </Label>
            <Input
              id="deadline"
              type="date"
              value={meta.deadline}
              onChange={setMetaField('deadline')}
              min={new Date().toISOString().split('T')[0]}
              required={bidMode === 'deadline'}
            />
            {bidMode === 'open' && (
              <p className="text-xs text-muted-foreground">선착순형은 마감일 없이 연구자가 직접 낙찰 시점을 결정합니다.</p>
            )}
          </div>
          <AddressSearch
            id="deliveryAddress"
            label="배송지"
            value={meta.deliveryAddress}
            onChange={v => setMeta(prev => ({ ...prev, deliveryAddress: v }))}
            onCityChange={c => setMeta(prev => ({ ...prev, deliveryCity: c }))}
          />
          <div className="space-y-2">
            <Label htmlFor="deliveryCity">
              배송 도시 <span className="text-destructive">*</span>
              <span className="ml-1 text-xs font-normal text-muted-foreground">(대리점 권역)</span>
            </Label>
            <Input
              id="deliveryCity"
              value={meta.deliveryCity}
              onChange={setMetaField('deliveryCity')}
              placeholder="예: 서울특별시 관악구"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>결제조건 <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_TERMS.map(t => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setMeta(prev => ({ ...prev, paymentTerms: t.value }))}
                  className={cn(
                    'rounded-md border p-2.5 text-left transition',
                    meta.paymentTerms === t.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">추가 요청사항</Label>
            <textarea
              id="notes"
              value={meta.notes}
              onChange={setMetaField('notes')}
              rows={2}
              placeholder="전체 품목에 적용되는 공통 요청사항"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </section>

        {/* 낙찰가 비공개 안내 */}
        <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-primary leading-snug">
            <span className="font-semibold">낙찰가 비공개 원칙</span> — 입찰가와 낙찰가는 거래 당사자에게만 공유되며,
            다른 공급사에는 공개되지 않습니다. 나라장터와 달리 민간 플랫폼으로서 비공개를 원칙으로 합니다.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full">미리보기 →</Button>
      </form>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
