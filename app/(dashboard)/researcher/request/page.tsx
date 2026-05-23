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
import type { SubstanceResult } from '@/app/api/substances/search/route'
import type { ItemType } from '@/lib/categories'
import type { EquipmentSubType } from '@/lib/equipment-specs'
import { cn } from '@/lib/utils'
import { FlaskConical, Layers, Clock, CalendarClock, ShieldCheck } from 'lucide-react'

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

const BID_MODE_OPTIONS: { value: BidMode; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    value: 'open',
    icon: <Clock className="h-5 w-5" />,
    label: '선착순형',
    desc: '마감 기한 없이 연구자가 원하는 시점에 직접 낙찰합니다. 빠른 조달이 필요할 때 적합합니다.',
  },
  {
    value: 'deadline',
    icon: <CalendarClock className="h-5 w-5" />,
    label: '기간 마감형',
    desc: '설정한 마감일까지 입찰을 받고, 이후 최적 견적을 비교해 선택합니다.',
  },
]

export default function SingleRequestPage() {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [itemType, setItemType] = useState<ItemType>('reagent')
  const [bidMode, setBidMode] = useState<BidMode>('open')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 단백질 필드 상태
  const [proteinSubCat, setProteinSubCat] = useState('')
  const [proteinSpecies, setProteinSpecies] = useState('')
  const [proteinTag, setProteinTag] = useState('')
  const [proteinPurity, setProteinPurity] = useState('')
  const [proteinApps, setProteinApps] = useState<string[]>([])
  const [proteinStorage, setProteinStorage] = useState('')

  // 장비 필드 상태
  const [equipSubType, setEquipSubType] = useState<EquipmentSubType | ''>('')
  const [equipSpecs, setEquipSpecs] = useState<Record<string, string>>({})

  // 소모품·실험기구 상태
  const [supplyTopType, setSupplyTopType] = useState<SupplyTopType | ''>('')
  const [supplySubCode, setSupplySubCode] = useState('')

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
        setError('장비명을 입력해주세요.')
        return
      }
      if (!equipSubType) {
        setError('장비 유형을 선택해주세요.')
        return
      }
    } else if (itemType === 'supply') {
      if (!supplyTopType) {
        setError('소모품/실험기구 대분류를 선택해주세요.')
        return
      }
      if (!supplySubCode) {
        setError('세부 분류를 선택해주세요.')
        return
      }
      if (!form.substanceName.trim()) {
        setError('제품명을 입력해주세요.')
        return
      }
    } else {
      if (!form.substanceName.trim()) {
        setError('물질명(또는 제품명)을 입력해주세요.')
        return
      }
      if (itemType === 'protein' && !proteinSubCat) {
        setError('단백질 분류를 선택해주세요.')
        return
      }
    }

    if (!form.qty || Number(form.qty) <= 0) {
      setError('수량을 올바르게 입력해주세요.')
      return
    }
    if (bidMode === 'deadline' && !form.deadline) {
      setError('기간 마감형은 입찰 마감일을 입력해주세요.')
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
        fd.set('substanceName', equipSpecs['device_name'] ?? '장비 요청')
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
    itemType === 'equipment' ? '장비명'
    : itemType === 'protein' ? '단백질·제품명'
    : itemType === 'supply' ? '제품명'
    : '물질명'

  const typeSelector = (
    <div className="flex gap-3 mb-6">
      <div className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-3 flex-1">
        <FlaskConical className="h-5 w-5 text-primary shrink-0" />
        <div>
          <div className="font-medium text-sm">단건 요청</div>
          <div className="text-xs text-muted-foreground">품목 1개</div>
        </div>
      </div>
      <Link
        href="/researcher/request/batch"
        className="flex items-center gap-2 rounded-lg border-2 border-border px-4 py-3 flex-1 hover:border-muted-foreground transition-colors"
      >
        <Layers className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <div className="font-medium text-sm">묶음 요청</div>
          <div className="text-xs text-muted-foreground">품목 2개 이상</div>
        </div>
      </Link>
    </div>
  )

  if (step === 'preview') {
    const bidModeLabel = bidMode === 'open' ? '선착순형 (연구자 직접 마감)' : '기간 마감형'
    const itemTypeLabelMap: Record<ItemType, string> = {
      reagent: '화학·바이오 시약',
      protein: '단백질·펩타이드 시약',
      supply: '소모품·실험기구',
      equipment: '장비·기기',
    }
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold mb-1">요청 확인</h1>
        <p className="text-sm text-muted-foreground mb-6">내용을 확인하고 게시하세요.</p>

        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          <PreviewRow label="품목 유형" value={itemTypeLabelMap[itemType]} />
          <PreviewRow label={substanceNameLabel} value={form.substanceName || equipSpecs['device_name'] || ''} />
          {form.casNumber && <PreviewRow label="CAS 번호" value={form.casNumber} mono />}
          {form.molecularFormula && <PreviewRow label="분자식" value={form.molecularFormula} mono />}
          {proteinSubCat && <PreviewRow label="단백질 분류" value={proteinSubCat} />}
          {equipSubType && <PreviewRow label="장비 유형" value={equipSubType} />}
          <PreviewRow label="수량" value={`${form.qty} ${form.unit}`} />
          {form.purity && <PreviewRow label="순도 / 등급" value={form.purity} />}
          {form.volume && <PreviewRow label="용량 규격" value={form.volume} />}
          <PreviewRow label="입찰 방식" value={bidModeLabel} />
          {form.deadline && (
            <PreviewRow
              label={bidMode === 'deadline' ? '입찰 마감일' : '납기 희망일'}
              value={form.deadline}
            />
          )}
          {form.deliveryAddress && <PreviewRow label="배송지" value={form.deliveryAddress} />}
          {form.notes && <PreviewRow label="추가 요청사항" value={form.notes} />}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-primary leading-snug">
            입찰가와 낙찰가는 거래 당사자 간에만 공유되며, 다른 공급사에 공개되지 않습니다.
          </p>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={() => setStep('form')} disabled={submitting}>수정</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '게시 중...' : '견적 요청 게시'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1">견적 요청</h1>
      <p className="text-sm text-muted-foreground mb-6">요청 유형을 선택하세요.</p>

      {typeSelector}

      <form onSubmit={handlePreview} className="space-y-5">
        {/* 품목 유형 */}
        <ItemTypeSelector value={itemType} onChange={handleTypeChange} />

        {/* 시약: CAS/물질명 검색 */}
        {itemType === 'reagent' && (
          <>
            <SubstanceSearch
              label="물질명 검색 *"
              placeholder="CAS 번호 또는 물질명 (예: 64-17-5, ethanol)"
              onSelect={handleSubstanceSelect}
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
                <Label htmlFor="substanceName">물질명 직접 입력 *</Label>
                <Input
                  id="substanceName"
                  value={form.substanceName}
                  onChange={set('substanceName')}
                  placeholder="검색 목록에 없으면 직접 입력"
                />
              </div>
            )}
          </>
        )}

        {/* 단백질·펩타이드: 분류 선택 → 키워드 칩 → 제품명 입력 */}
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

            {/* 키워드 칩 */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                추천 제품·물질 <span className="text-xs text-muted-foreground">(클릭 시 제품명 자동 입력)</span>
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

            {/* 제품명 직접 입력 */}
            <div className="space-y-1.5">
              <Label htmlFor="substanceName">제품명 / 단백질명 *</Label>
              <Input
                id="substanceName"
                value={form.substanceName}
                onChange={set('substanceName')}
                placeholder="위 추천 항목 클릭 또는 직접 입력"
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

        {/* 소모품·실험기구 전용 필드 */}
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

        {/* 장비 전용 필드 */}
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
              <Label htmlFor="purity">순도 / 등급</Label>
              <Input id="purity" value={form.purity} onChange={set('purity')} placeholder="예: 99.9%, ACS grade, HPLC grade" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume">용량 규격</Label>
              <Input id="volume" value={form.volume} onChange={set('volume')} placeholder="예: 500mL 병, 1kg 단위 포장" />
            </div>
          </>
        )}

        {/* 수량 + 단위 (공통) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="qty">수량 *</Label>
            <Input id="qty" type="number" min="0.001" step="any" value={form.qty} onChange={set('qty')} placeholder="예: 500" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">단위 *</Label>
            <select
              id="unit"
              value={form.unit}
              onChange={set('unit')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* 입찰 방식 */}
        <div className="space-y-2">
          <Label>입찰 방식 *</Label>
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
            {bidMode === 'deadline' ? '입찰 마감일 *' : '납기 희망일 (선택)'}
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
            <p className="text-xs text-muted-foreground">선착순형은 마감일 없이 연구자가 직접 낙찰 시점을 결정합니다.</p>
          )}
        </div>

        <AddressSearch
          id="deliveryAddress"
          label="배송지"
          value={form.deliveryAddress}
          onChange={v => setForm(prev => ({ ...prev, deliveryAddress: v }))}
        />

        <div className="space-y-2">
          <Label htmlFor="notes">추가 요청사항</Label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            placeholder="공급자에게 전달할 특이사항 (포장 방법, 인증서 필요 여부 등)"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

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

function PreviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm', mono && 'font-mono')}>{value}</span>
    </div>
  )
}
