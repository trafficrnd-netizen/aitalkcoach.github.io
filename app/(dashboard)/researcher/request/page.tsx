'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubstanceSearch } from '@/components/substance-search'
import { ItemTypeSelector } from '@/components/item-type-selector'
import { ProteinFields } from '@/components/protein-fields'
import { EquipmentFields } from '@/components/equipment-fields'
import { SupplyFields } from '@/components/supply-fields'
import { AddressSearch } from '@/components/address-search'
import { PROTEIN_KEYWORDS, PROTEIN_GENERAL_KEYWORDS } from '@/lib/protein-keywords'
import type { SupplyTopType } from '@/lib/supply-keywords'
import { createSingleRequest } from '@/lib/actions/request'
import { PreferredSupplierPicker, type RoutingMode } from '@/components/preferred-supplier-picker'
import { PAYMENT_TERMS, paymentTermLabel, type PaymentTermValue } from '@/lib/payment-terms'
import type { SubstanceResult } from '@/app/api/substances/search/route'
import type { ItemType } from '@/lib/categories'
import type { EquipmentSubType } from '@/lib/equipment-specs'
import { useT } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { FlaskConical, Layers, Clock, CalendarClock, ShieldCheck, TriangleAlert, ShieldAlert } from 'lucide-react'
import { checkRegulated, type RegulatedSubstance } from '@/lib/regulated-substances'

const UNITS = ['mL', 'L', 'g', 'kg', 'mg', 'μg', 'μL', 'ea', '박스', '기타']

type Step = 'form' | 'preview'
type BidMode = 'open' | 'deadline'

interface FormState {
  substanceName: string
  casNumber: string
  molecularFormula: string
  qty: string
  unit: string
  purity: string
  volume: string
  deadline: string
  deliveryAddress: string
  notes: string
}

const EMPTY: FormState = {
  substanceName: '',
  casNumber: '',
  molecularFormula: '',
  qty: '',
  unit: 'mL',
  purity: '',
  volume: '',
  deadline: '',
  deliveryAddress: '',
  notes: '',
}

// BID_MODE_OPTIONS is defined inside the component (uses t())

export default function SingleRequestPage() {
  const t = useT()

  const BID_MODE_OPTIONS: { value: BidMode; icon: React.ReactNode; label: string; desc: string }[] = [
    {
      value: 'open',
      icon: <Clock className="h-5 w-5" />,
      label: t('req.bidModeOpen'),
      desc: t('req.bidModeOpenDesc'),
    },
    {
      value: 'deadline',
      icon: <CalendarClock className="h-5 w-5" />,
      label: t('req.bidModeDeadline'),
      desc: t('req.bidModeDeadlineDesc'),
    },
  ]

  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [itemType, setItemType] = useState<ItemType>('reagent')
  const [bidMode, setBidMode] = useState<BidMode>('open')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [proteinSubCat, setProteinSubCat] = useState('')
  const [proteinSpecies, setProteinSpecies] = useState('')
  const [proteinTag, setProteinTag] = useState('')
  const [proteinPurity, setProteinPurity] = useState('')
  const [proteinApps, setProteinApps] = useState<string[]>([])
  const [proteinStorage, setProteinStorage] = useState('')

  const [equipSubType, setEquipSubType] = useState<EquipmentSubType | ''>('')
  const [equipSpecs, setEquipSpecs] = useState<Record<string, string>>({})

  const [supplyTopType, setSupplyTopType] = useState<SupplyTopType | ''>('')
  const [supplySubCode, setSupplySubCode] = useState('')

  // 단골 공급자 라우팅 + 쿠폰
  const [routing, setRouting] = useState<{ mode: RoutingMode; supplierCode: string | null; couponId: string | null }>({
    mode: 'open', supplierCode: null, couponId: null,
  })

  // 도시(대리점 권역) + 결제조건
  const [deliveryCity, setDeliveryCity] = useState('')
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermValue | ''>('')

  // 그룹바이 / 할인요청
  const [isGroupBuy, setIsGroupBuy] = useState(false)
  const [discountRequested, setDiscountRequested] = useState(false)

  // 규제물질 체크
  const [regulationInfo, setRegulationInfo] = useState<RegulatedSubstance | null>(null)

  function setSpecField(key: string, value: string) {
    setEquipSpecs(prev => ({ ...prev, [key]: value }))
  }

  function handleSubstanceSelect(s: SubstanceResult) {
    setForm(prev => ({
      ...prev,
      substanceName: s.name || s.iupacName || '',
      casNumber: s.casNumber ?? '',
      molecularFormula: s.molecularFormula ?? '',
    }))
    setRegulationInfo(checkRegulated(s.casNumber))
  }

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handleTypeChange(type: ItemType) {
    setItemType(type)
    setForm(EMPTY)
    setProteinSubCat(''); setProteinSpecies(''); setProteinTag('')
    setProteinPurity(''); setProteinApps([]); setProteinStorage('')
    setEquipSubType(''); setEquipSpecs({})
    setSupplyTopType(''); setSupplySubCode('')
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (itemType === 'equipment') {
      if (!form.substanceName.trim() && !equipSpecs['device_name']) {
        setError(t('req.errDeviceName'))
        return
      }
      if (!equipSubType) {
        setError(t('req.errEquipType'))
        return
      }
    } else if (itemType === 'supply') {
      if (!supplyTopType) {
        setError(t('req.errSupplyTop'))
        return
      }
      if (!supplySubCode) {
        setError(t('req.errSupplySub'))
        return
      }
      if (!form.substanceName.trim()) {
        setError(t('req.errProductName'))
        return
      }
    } else {
      if (!form.substanceName.trim()) {
        setError(t('req.errSubstanceName'))
        return
      }
      if (itemType === 'protein' && !proteinSubCat) {
        setError(t('req.errProteinCat'))
        return
      }
    }

    if (!form.qty || Number(form.qty) <= 0) {
      setError(t('req.errQty'))
      return
    }
    if (bidMode === 'deadline' && !form.deadline) {
      setError(t('req.errDeadline'))
      return
    }
    if (!deliveryCity.trim()) {
      setError(t('req.errCity'))
      return
    }
    if (!paymentTerms) {
      setError(t('req.errPayment'))
      return
    }
    setStep('preview')
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.set('bidMode', bidMode)
    fd.set('itemType', itemType)
    fd.set('deliveryCity', deliveryCity.trim())
    fd.set('paymentTerms', paymentTerms)
    fd.set('isGroupBuy', String(isGroupBuy))
    fd.set('discountRequested', String(discountRequested))

    // 단골 공급자 라우팅 + 쿠폰 (mode: open이면 미전송)
    if (routing.mode !== 'open' && routing.supplierCode) {
      fd.set('supplierCode', routing.supplierCode)
      fd.set('routingMode', routing.mode)  // 'direct' | 'both'
      if (routing.couponId) fd.set('couponId', routing.couponId)
    }

    if (itemType === 'protein') {
      fd.set('itemSubType', proteinSubCat)
      const specs = {
        species: proteinSpecies,
        tag: proteinTag,
        purity_grade: proteinPurity,
        applications: proteinApps,
        storage_temp: proteinStorage,
      }
      fd.set('itemSpecs', JSON.stringify(specs))
    } else if (itemType === 'supply') {
      fd.set('itemSubType', supplySubCode)
      fd.set('itemSpecs', JSON.stringify({ top_type: supplyTopType, sub_code: supplySubCode }))
    } else if (itemType === 'equipment') {
      fd.set('itemSubType', equipSubType)
      const specs: Record<string, string | string[]> = {}
      Object.entries(equipSpecs).forEach(([k, v]) => {
        if (v) specs[k] = v.includes(',') ? v.split(',') : v
      })
      fd.set('itemSpecs', JSON.stringify(specs))
      if (!form.substanceName) {
        fd.set('substanceName', equipSpecs['device_name'] ?? t('req.defaultEquipName'))
      }
    }

    const result = await createSingleRequest(fd)
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
      setStep('form')
    }
  }

  const substanceNameLabel =
    itemType === 'equipment' ? t('req.substanceLabelEquip')
    : itemType === 'protein' ? t('req.substanceLabelProtein')
    : itemType === 'supply' ? t('req.substanceLabelSupply')
    : t('req.substanceLabelReagent')

  const typeSelector = (
    <div className="flex gap-3 mb-6">
      <div className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-3 flex-1">
        <FlaskConical className="h-5 w-5 text-primary shrink-0" />
        <div>
          <div className="font-medium text-sm">{t('req.singleTitle')}</div>
          <div className="text-xs text-muted-foreground">{t('req.singleSub')}</div>
        </div>
      </div>
      <Link
        href="/researcher/request/batch"
        className="flex items-center gap-2 rounded-lg border-2 border-border px-4 py-3 flex-1 hover:border-muted-foreground transition-colors"
      >
        <Layers className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <div className="font-medium text-sm">{t('req.batchTitle')}</div>
          <div className="text-xs text-muted-foreground">{t('req.batchSub')}</div>
        </div>
      </Link>
    </div>
  )

  if (step === 'preview') {
    const bidModeLabel = bidMode === 'open' ? t('req.bidModeOpenFull') : t('req.bidModeDeadline')
    const itemTypeLabelMap: Record<ItemType, string> = {
      reagent: t('req.typeReagent'),
      protein: t('req.typeProtein'),
      supply: t('req.typeSupply'),
      equipment: t('req.typeEquipment'),
    }
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold mb-1">{t('req.previewTitle')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('req.previewSub')}</p>

        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          <PreviewRow label={t('req.rowType')} value={itemTypeLabelMap[itemType]} />
          <PreviewRow label={substanceNameLabel} value={form.substanceName || equipSpecs['device_name'] || ''} />
          {form.casNumber && <PreviewRow label={t('req.rowCas')} value={form.casNumber} mono />}
          {form.molecularFormula && <PreviewRow label={t('req.rowFormula')} value={form.molecularFormula} mono />}
          {proteinSubCat && <PreviewRow label={t('req.rowProteinCat')} value={proteinSubCat} />}
          {equipSubType && <PreviewRow label={t('req.rowEquipType')} value={equipSubType} />}
          <PreviewRow label={t('req.rowQty')} value={`${form.qty} ${form.unit}`} />
          {form.purity && <PreviewRow label={t('req.rowPurity')} value={form.purity} />}
          {form.volume && <PreviewRow label={t('req.rowVolume')} value={form.volume} />}
          <PreviewRow label={t('req.rowBidMode')} value={bidModeLabel} />
          {form.deadline && (
            <PreviewRow
              label={bidMode === 'deadline' ? t('req.rowBidDeadline') : t('req.rowDeliveryDate')}
              value={form.deadline}
            />
          )}
          {form.deliveryAddress && <PreviewRow label={t('req.rowAddress')} value={form.deliveryAddress} />}
          {deliveryCity && <PreviewRow label={t('req.rowCity')} value={deliveryCity} />}
          {paymentTerms && <PreviewRow label={t('req.rowPayment')} value={paymentTermLabel(paymentTerms)} />}
          {isGroupBuy && <PreviewRow label={t('req.rowGroupBuy')} value={t('req.groupBuyOn')} />}
          {discountRequested && <PreviewRow label={t('req.rowDiscount')} value={t('req.discountOn')} />}
          {form.notes && <PreviewRow label={t('req.rowNotes')} value={form.notes} />}
        </div>

        {/* 규제물질 경고 */}
        {regulationInfo && (
          <div className={cn(
            'mt-4 flex items-start gap-2 rounded-md border px-3 py-2.5',
            regulationInfo.level === 'high'
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50'
          )}>
            <ShieldAlert className={cn(
              'h-4 w-4 shrink-0 mt-0.5',
              regulationInfo.level === 'high' ? 'text-red-600' : 'text-amber-600'
            )} />
            <div className={cn(
              'text-xs leading-snug',
              regulationInfo.level === 'high' ? 'text-red-800' : 'text-amber-800'
            )}>
              <span className="font-semibold">
                {regulationInfo.level === 'high' ? '⚠️ 고위험 규제물질 포함' : '관리대상 물질 포함'}
              </span>
              {' — '}
              <span className="font-mono">{regulationInfo.cas}</span> ({regulationInfo.nameKo})
              <span className="block mt-0.5">
                적용 규정: {regulationInfo.regs.join(' · ')}
                {regulationInfo.level === 'high' && ' — 취급 전 기관 허가 여부를 반드시 확인하세요.'}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-primary leading-snug">
{t('req.sealedBidShort')}
          </p>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={() => setStep('form')} disabled={submitting}>{t('req.editBtn')}</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('req.submittingBtn') : t('req.submitBtn')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1">{t('req.title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('req.subtitle')}</p>

      {typeSelector}

      <form onSubmit={handlePreview} className="space-y-5">
        {/* 품목 유형 */}
        <ItemTypeSelector value={itemType} onChange={handleTypeChange} />

        {/* E: HAZMAT 주의 배너 — 시약·화학물질 선택 시 표시 */}
        {itemType === 'reagent' && (
          <div className="flex items-start gap-2 rounded-md border border-orange-300 bg-orange-50 px-3 py-2.5">
            <TriangleAlert className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-800 leading-snug">
<><span className="font-semibold">{t('req.hazmatTitle')}</span> — {t('req.hazmatDesc')}</>{' '}
              {form.casNumber && (
                <span className="font-mono font-medium">입력된 CAS: {form.casNumber}</span>
              )}
              {!form.casNumber && t('req.hazmatCheck')}
            </div>
          </div>
        )}

        {/* 시약: CAS/물질명 검색 */}
        {itemType === 'reagent' && (
          <>
            <SubstanceSearch
              label={t('req.reagentSearchLabel')}
              placeholder={t('req.reagentSearchPh')}
              onSelect={handleSubstanceSelect}
              onRegulationChange={setRegulationInfo}
            />

            {form.substanceName && (
              <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
                <span className="font-medium">{form.substanceName}</span>
                {form.casNumber && (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{form.casNumber}</span>
                )}
                {form.molecularFormula && (
                  <span className="ml-2 text-xs text-muted-foreground">{form.molecularFormula}</span>
                )}
                <button
                  type="button"
                  className="ml-3 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setForm(prev => ({ ...prev, substanceName: '', casNumber: '', molecularFormula: '' }))}
                >
                  지우기
                </button>
              </div>
            )}

            {!form.substanceName && (
              <div className="space-y-2">
                <Label htmlFor="substanceName">{t('req.substanceDirectLabel')}</Label>
                <Input
                  id="substanceName"
                  value={form.substanceName}
                  onChange={set('substanceName')}
                  placeholder={t('req.substanceDirectPh')}
                />
              </div>
            )}
          </>
        )}

        {/* 단백질·펩타이드 */}
        {itemType === 'protein' && (
          <>
            <ProteinFields
              subCategory={proteinSubCat} setSubCategory={setProteinSubCat}
              species={proteinSpecies} setSpecies={setProteinSpecies}
              tag={proteinTag} setTag={setProteinTag}
              purity={proteinPurity} setPurity={setProteinPurity}
              applications={proteinApps} setApplications={setProteinApps}
              storageTemp={proteinStorage} setStorageTemp={setProteinStorage}
            />

            <div className="space-y-1.5">
              <Label className="text-sm">
  {t('req.proteinRecommLabel')} <span className="text-xs text-muted-foreground">{t('req.proteinRecommNote')}</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {(proteinSubCat ? (PROTEIN_KEYWORDS[proteinSubCat] ?? []) : PROTEIN_GENERAL_KEYWORDS).map(kw => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, substanceName: kw }))}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      form.substanceName === kw
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:border-primary'
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="substanceName">{t('req.proteinNameLabel')}</Label>
              <Input
                id="substanceName"
                value={form.substanceName}
                onChange={set('substanceName')}
                placeholder={t('req.proteinNamePh')}
              />
              {form.substanceName && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setForm(prev => ({ ...prev, substanceName: '' }))}
                >
                  지우기
                </button>
              )}
            </div>
          </>
        )}

        {/* 소모품·실험기구 */}
        {itemType === 'supply' && (
          <SupplyFields
            topType={supplyTopType}
            setTopType={setSupplyTopType}
            subCode={supplySubCode}
            setSubCode={setSupplySubCode}
            productName={form.substanceName}
            setProductName={v => setForm(prev => ({ ...prev, substanceName: v }))}
          />
        )}

        {/* 장비 */}
        {itemType === 'equipment' && (
          <EquipmentFields
            subType={equipSubType} setSubType={setEquipSubType}
            specs={equipSpecs} setSpec={setSpecField}
            onKeywordSelect={kw => {
              setSpecField('device_name', kw)
              setForm(prev => ({ ...prev, substanceName: kw }))
            }}
          />
        )}

        {/* 화학시약 전용: 순도·용량 */}
        {itemType === 'reagent' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="purity">{t('req.purityLabel')}</Label>
              <Input id="purity" value={form.purity} onChange={set('purity')} placeholder={t('req.purityPh')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume">{t('req.volumeLabel')}</Label>
              <Input id="volume" value={form.volume} onChange={set('volume')} placeholder={t('req.volumePh')} />
            </div>
          </>
        )}

        {/* 수량 + 단위 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="qty">{t('req.qtyLabel')}</Label>
            <Input id="qty" type="number" min="0.001" step="any" value={form.qty} onChange={set('qty')} placeholder={t('req.qtyPh')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">{t('req.unitLabel')}</Label>
            <select
              id="unit"
              value={form.unit}
              onChange={set('unit')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {UNITS.map(u => <option key={u} value={u}>{u === '박스' || u === '기타' ? t(`unit.${u}`) : u}</option>)}
            </select>
          </div>
        </div>

        {/* 입찰 방식 */}
        <div className="space-y-2">
          <Label>{t('req.bidModeLabel')}</Label>
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
                  {opt.icon}{opt.label}
                </span>
                <span className="text-xs text-muted-foreground leading-snug">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">
            {bidMode === 'deadline' ? t('req.deadlineLabel') : t('req.deliveryDateLabel')}
          </Label>
          <Input
            id="deadline"
            type="date"
            value={form.deadline}
            onChange={set('deadline')}
            min={new Date().toISOString().split('T')[0]}
            required={bidMode === 'deadline'}
          />
          {bidMode === 'open' && (
            <p className="text-xs text-muted-foreground">{t('req.openModeNote')}</p>
          )}
        </div>

        {/* 단골 공급자 직접/공개/동시 + 쿠폰 (팔로우 공급자 있을 때만 노출) */}
        <PreferredSupplierPicker onChange={setRouting} />

        <AddressSearch
          id="deliveryAddress"
          label={t('req.deliveryAddrLabel')}
          value={form.deliveryAddress}
          onChange={v => setForm(prev => ({ ...prev, deliveryAddress: v }))}
          onCityChange={setDeliveryCity}
        />

        {/* 배송 도시 (대리점 권역) — 필수 */}
        <div className="space-y-2">
          <Label htmlFor="deliveryCity">
{t('req.cityLabel')} <span className="text-destructive">*</span>
            <span className="ml-1 text-xs font-normal text-muted-foreground">{t('req.cityRequired')}</span>
          </Label>
          <Input
            id="deliveryCity"
            value={deliveryCity}
            onChange={e => setDeliveryCity(e.target.value)}
            placeholder={t('req.cityPh')}
            required
          />
          <p className="text-xs text-muted-foreground">{t('req.cityNote')}</p>
        </div>

        {/* 결제조건 — 연구자 선택 (공급자 신뢰도 판단) */}
        <div className="space-y-2">
          <Label>{t('req.paymentLabel')} <span className="text-destructive">*</span></Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PAYMENT_TERMS.map(t => (
              <button
                type="button"
                key={t.value}
                onClick={() => setPaymentTerms(t.value)}
                className={cn(
                  'rounded-md border p-2.5 text-left transition',
                  paymentTerms === t.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                )}
              >
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-[11px] text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('req.paymentNote')}</p>
        </div>

        {/* 그룹바이 / 할인요청 옵션 */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">{t('req.optionsLabel')}</p>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isGroupBuy}
              onChange={e => setIsGroupBuy(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-secondary"
            />
            <span className="text-sm">
              <span className="font-medium">{t('req.groupBuyLabel')}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{t('req.groupBuyDesc')}</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={discountRequested}
              onChange={e => setDiscountRequested(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-amber-500"
            />
            <span className="text-sm">
              <span className="font-medium">{t('req.discountLabel')}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{t('req.discountDesc')}</span>
            </span>
          </label>
        </div>

        {/* 요청사항 */}
        <div>
          <Label htmlFor="notes">{t('req.notesLabel')}</Label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3}
            placeholder={t('req.notesPh')}
            className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? t('req.submittingBtn') : t('req.submitBtn')}
          </Button>
        </div>
      </form>
    </div>
  )
}

function PreviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm', mono && 'font-mono')}>{value}</span>
    </div>
  )
}
