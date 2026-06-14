'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AddressSearch } from '@/components/address-search'
import { ProductSearch } from '@/components/medi/product-search'
import { LinkPreview } from '@/components/medi/link-preview'
import { createMediRequest } from '@/lib/actions/medi-request'
import { useT } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { Clock, CalendarClock, Sparkles, ArrowRight, ArrowLeft, Gift, Link as LinkIcon } from 'lucide-react'
import {
  AESTHETIC_TYPES,
  AESTHETIC_TYPE_LABELS,
  AESTHETIC_TYPE_ICONS,
  AESTHETIC_UNITS,
  AESTHETIC_TREE,
  type AestheticType,
} from '@/lib/aesthetic/catalog'

type Step = 'form' | 'preview'
type BidMode = 'open' | 'deadline'

interface FormState {
  productName: string
  productCode: string
  productType: AestheticType
  qty: string
  unit: string
  deadline: string
  deliveryCity: string
  notes: string
  bidMode: BidMode
  productUrl: string
}

const EMPTY: FormState = {
  productName: '',
  productCode: '',
  productType: 'device',
  qty: '',
  unit: 'ea',
  deadline: '',
  deliveryCity: '',
  notes: '',
  bidMode: 'open',
  productUrl: '',
}

export default function MediRequestPage() {
  const t = useT()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // URL 입력 디바운스: 800ms 후 미리보기 업데이트
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPreviewUrl(urlInput.trim())
      set('productUrl', urlInput.trim())
    }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlInput])

  function set(k: keyof FormState, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productName.trim()) return setError('제품명을 입력해주세요.')
    if (!form.qty || Number(form.qty) <= 0) return setError('수량을 입력해주세요.')
    if (!form.deliveryCity.trim()) return setError('배송 도시를 입력해주세요.')
    setError(null)
    setStep('preview')
  }

  async function handleSubmit() {
    setPending(true)
    setError(null)
    const fd = new FormData()
    fd.set('productName', form.productName)
    fd.set('productCode', form.productCode)
    fd.set('productType', form.productType)
    fd.set('qty', form.qty)
    fd.set('unit', form.unit)
    fd.set('deadline', form.deadline)
    fd.set('deliveryCity', form.deliveryCity)
    fd.set('notes', form.notes)
    fd.set('bidMode', form.bidMode)
    fd.set('productUrl', form.productUrl)
    const result = await createMediRequest(fd)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  const BID_MODES: { value: BidMode; icon: React.ReactNode; label: string; desc: string }[] = [
    { value: 'open', icon: <Clock className="h-5 w-5" />, label: t('medi.req.bidModeOpen'), desc: t('medi.req.bidModeOpenDesc') },
    { value: 'deadline', icon: <CalendarClock className="h-5 w-5" />, label: t('medi.req.bidModeDeadline'), desc: t('medi.req.bidModeDeadlineDesc') },
  ]

  if (step === 'preview') {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">{t('medi.req.preview')}</h1>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
            <Gift className="h-3 w-3" /> {t('medi.req.free')}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-background p-5 space-y-3 text-sm">
          <Row label={t('medi.req.productName')} value={form.productName} />
          <Row label={t('medi.req.productType')} value={`${AESTHETIC_TYPE_ICONS[form.productType]} ${AESTHETIC_TYPE_LABELS[form.productType]}`} />
          <Row label={t('medi.req.qty')} value={`${form.qty} ${form.unit}`} />
          {form.deadline && <Row label={t('medi.req.deadline')} value={form.deadline} />}
          <Row label={t('medi.req.deliveryCity')} value={form.deliveryCity} />
          <Row label={t('medi.req.bidMode')} value={form.bidMode === 'open' ? t('medi.req.bidModeOpen') : t('medi.req.bidModeDeadline')} />
          {form.notes && <Row label={t('medi.req.notes')} value={form.notes} />}
          {form.productUrl && (
            <div className="flex gap-2">
              <span className="w-28 shrink-0 text-muted-foreground">제품 링크</span>
              <div className="flex-1 min-w-0">
                <LinkPreview url={form.productUrl} readonly />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('form')} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> {t('medi.req.back')}
          </Button>
          <Button onClick={handleSubmit} disabled={pending} className="gap-1">
            {pending ? '등록 중...' : t('medi.req.submit')} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">{t('medi.req.title')}</h1>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
            <Gift className="h-3 w-3" /> {t('medi.req.free')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t('medi.req.sub')}</p>
      </div>

      <form onSubmit={handlePreview} className="space-y-5">
        {/* 자주 찾는 제품 */}
        <div className="space-y-1.5">
          <Label htmlFor="productName">자주 찾는 제품 <span className="text-destructive">*</span></Label>
          <ProductSearch
            value={form.productName}
            onChange={v => { set('productName', v); if (!v) set('productCode', '') }}
            onSelect={r => {
                set('productName', r.label)
                set('productCode', r.code)
                set('productType', r.type)
                if (r.unit) set('unit', r.unit)
              }}
            placeholder={t('medi.req.productNamePh')}
          />
        </div>

        {/* 품목 유형 */}
        <div className="space-y-1.5">
          <Label>{t('medi.req.productType')}</Label>
          <div className="flex gap-2 flex-wrap">
            {AESTHETIC_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => { set('productType', type); set('productCode', ''); set('productName', '') }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  form.productType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {AESTHETIC_TYPE_ICONS[type]} {AESTHETIC_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* 하위 카테고리 (제품 미선택 시) */}
          {!form.productCode && (
            <div className="flex gap-1.5 flex-wrap mt-2 pt-2 border-t border-border/50">
              {AESTHETIC_TREE[form.productType].map(node => (
                <button
                  key={node.code}
                  type="button"
                  onClick={() => {
                    set('productName', node.label)
                    set('productCode', node.code)
                  }}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
                >
                  {node.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 수량 + 단위 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="qty">{t('medi.req.qty')} <span className="text-destructive">*</span></Label>
            <Input
              id="qty"
              type="number"
              min={1}
              value={form.qty}
              onChange={e => set('qty', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit">{t('medi.req.unit')}</Label>
            <select
              id="unit"
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {AESTHETIC_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* 입찰 방식 */}
        <div className="space-y-1.5">
          <Label>{t('medi.req.bidMode')}</Label>
          <div className="grid grid-cols-2 gap-3">
            {BID_MODES.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => set('bidMode', m.value)}
                className={cn(
                  'flex flex-col items-start rounded-xl border p-3 text-left transition-colors',
                  form.bidMode === m.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <span className={cn('mb-1', form.bidMode === m.value ? 'text-primary' : 'text-muted-foreground')}>
                  {m.icon}
                </span>
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[10px] text-muted-foreground leading-snug">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 납기 희망일 (마감 방식일 때만) */}
        {form.bidMode === 'deadline' && (
          <div className="space-y-1.5">
            <Label htmlFor="deadline">{t('medi.req.deadline')}</Label>
            <Input
              id="deadline"
              type="date"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        )}

        {/* 배송 도시 */}
        <div className="space-y-1.5">
          <Label htmlFor="deliveryCity">{t('medi.req.deliveryCity')} <span className="text-destructive">*</span></Label>
          <AddressSearch
            value={form.deliveryCity}
            onChange={v => set('deliveryCity', v)}
            label={t('medi.req.deliveryCity')}
            id="deliveryCity"
          />
        </div>

        {/* 제품 상세페이지 URL */}
        <div className="space-y-1.5">
          <Label htmlFor="productUrl" className="flex items-center gap-1">
            <LinkIcon className="h-3.5 w-3.5" />
            제품 상세페이지 링크 <span className="text-muted-foreground font-normal">(선택)</span>
          </Label>
          <Input
            id="productUrl"
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://..."
          />
          {previewUrl && (
            <LinkPreview
              url={previewUrl}
              onClear={() => { setUrlInput(''); setPreviewUrl(''); set('productUrl', '') }}
            />
          )}
        </div>

        {/* 추가 요청사항 */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">{t('medi.req.notes')}</Label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder={t('medi.req.notesPh')}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full gap-1">
          {t('medi.req.preview')} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
