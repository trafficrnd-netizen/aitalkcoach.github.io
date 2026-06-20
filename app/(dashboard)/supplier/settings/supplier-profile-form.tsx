'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { updateSupplierProfile } from '@/lib/actions/supplier'
import { ITEM_TYPE_LABELS, ITEM_TYPE_ICONS, CATEGORY_TREE, type ItemType } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Upload, X, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'

const ITEM_TYPES: ItemType[] = ['reagent', 'protein', 'supply', 'equipment']

/** 기존 최상위 코드('reagent','protein' 등)가 저장된 경우 하위 전체로 확장 */
function initFromSaved(saved: string[]): Set<string> {
  const result = new Set<string>()
  for (const code of saved) {
    if (ITEM_TYPES.includes(code as ItemType)) {
      // 최상위 타입 → 모든 하위 코드 추가
      for (const node of CATEGORY_TREE[code as ItemType] ?? []) {
        result.add(node.code)
        for (const child of node.children ?? []) result.add(child.code)
      }
    } else {
      result.add(code)
    }
  }
  return result
}

function getAllCodesForType(type: ItemType): string[] {
  const codes: string[] = []
  for (const node of CATEGORY_TREE[type] ?? []) {
    codes.push(node.code)
    for (const child of node.children ?? []) codes.push(child.code)
  }
  return codes
}

const ALL_CODES = ITEM_TYPES.flatMap(getAllCodesForType)

const REGIONS = [
  { value: 'seoul', label: '서울' },
  { value: 'gyeonggi', label: '경기·인천' },
  { value: 'chungcheong', label: '충청·세종' },
  { value: 'jeolla', label: '전라' },
  { value: 'gyeongsang', label: '경상' },
  { value: 'gangwon', label: '강원' },
  { value: 'jeju', label: '제주' },
  { value: 'nationwide', label: '전국 배송' },
]

interface SupplierProfile {
  user_id: string
  company_name: string
  business_number: string
  representative: string | null
  address: string | null
  phone: string | null
  categories: string[]
  regions: string[]
  plan: string
  credits: number
  early_bird: boolean
  protein_categories?: string[]
  equipment_categories?: string[]
  permit_url?: string | null
}

export function SupplierProfileForm({ profile }: { profile: SupplierProfile | null }) {
  const t = useT()
  const [selectedCats, setSelectedCats] = useState<Set<string>>(
    initFromSaved(profile?.categories ?? [])
  )
  const [expandedTypes, setExpandedTypes] = useState<Set<ItemType>>(new Set(ITEM_TYPES))
  const [regions, setRegions] = useState<string[]>(profile?.regions ?? [])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function toggleCat(code: string) {
    setSelectedCats(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code); else next.add(code)
      return next
    })
  }

  function toggleType(type: ItemType) {
    const codes = getAllCodesForType(type)
    const allSelected = codes.every(c => selectedCats.has(c))
    setSelectedCats(prev => {
      const next = new Set(prev)
      if (allSelected) codes.forEach(c => next.delete(c))
      else codes.forEach(c => next.add(c))
      return next
    })
  }

  function selectAll() { setSelectedCats(new Set(ALL_CODES)) }
  function deselectAll() { setSelectedCats(new Set()) }

  function toggleExpand(type: ItemType) {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type); else next.add(type)
      return next
    })
  }

  // 취급허가증 업로드
  const [permitUrl, setPermitUrl] = useState<string | null>(profile?.permit_url ?? null)
  const [permitUploading, setPermitUploading] = useState(false)
  const [permitError, setPermitError] = useState('')
  const permitFileRef = useRef<HTMLInputElement>(null)

  async function handlePermitUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setPermitError('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    setPermitError('')
    setPermitUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setPermitError('로그인이 필요합니다.'); return }

      const ext = file.name.split('.').pop()
      const path = `${user.id}/permit_${Date.now()}.${ext}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: uploadData, error: uploadErr } = await (supabase as any).storage
        .from('supplier-permits')
        .upload(path, file, { upsert: true })
      if (uploadErr) { setPermitError('업로드 실패: ' + uploadErr.message); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { publicUrl } } = (supabase as any).storage
        .from('supplier-permits')
        .getPublicUrl(uploadData.path)
      setPermitUrl(publicUrl)

      // permit_url 즉시 저장
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('supplier_profiles')
        .update({ permit_url: publicUrl })
        .eq('user_id', user.id)
    } finally {
      setPermitUploading(false)
    }
  }

  async function handlePermitRemove() {
    setPermitUrl(null)
    if (permitFileRef.current) permitFileRef.current.value = ''
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('supplier_profiles')
      .update({ permit_url: null })
      .eq('user_id', user.id)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    Array.from(selectedCats).forEach(c => formData.append('categories', c))
    regions.forEach(r => formData.append('regions', r))

    const result = await updateSupplierProfile(formData)

    if (result?.error) {
      setErrorMsg(result.error)
      setStatus('error')
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <section className="space-y-4">
        <h2 className="font-semibold">{t('spf.basicInfo')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">{t('spf.companyName')}</Label>
            <Input id="companyName" name="companyName" defaultValue={profile?.company_name ?? ''} required />
          </div>
          <div className="space-y-2">
            <Label>{t('spf.bizNumber')}</Label>
            <Input
              value={profile?.business_number
                ? profile.business_number.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
                : ''}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="representative">{t('spf.representative')}</Label>
            <Input id="representative" name="representative" defaultValue={profile?.representative ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('spf.phone')}</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ''} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">{t('spf.address')}</Label>
          <Input id="address" name="address" defaultValue={profile?.address ?? ''} />
        </div>
      </section>

      <Separator />

      {/* 취급 카테고리 — 연구자 분류체계와 동일 */}
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold">{t('spf.categorySection')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">공급 가능한 품목을 구체적으로 선택해주세요.</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              전체 해제
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {ITEM_TYPES.map(type => {
            const nodes = CATEGORY_TREE[type]
            const typeCodes = getAllCodesForType(type)
            const selectedCount = typeCodes.filter(c => selectedCats.has(c)).length
            const allTypeSelected = selectedCount === typeCodes.length
            const isExpanded = expandedTypes.has(type)

            return (
              <div key={type} className="rounded-lg border border-border overflow-hidden">
                {/* 타입 헤더 */}
                <div className="flex items-center gap-2 bg-muted/40 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleExpand(type)}
                    className="flex items-center gap-1.5 flex-1 text-left"
                  >
                    <span className="text-base">{ITEM_TYPE_ICONS[type]}</span>
                    <span className="text-sm font-semibold">{ITEM_TYPE_LABELS[type]}</span>
                    {selectedCount > 0 && (
                      <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {selectedCount}/{typeCodes.length}
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleType(type)}
                    className={cn(
                      'shrink-0 rounded px-2 py-0.5 text-[10px] font-medium border transition-colors',
                      allTypeSelected
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                    )}
                  >
                    {allTypeSelected ? '유형 해제' : '유형 전체'}
                  </button>
                </div>

                {/* 하위 카테고리 */}
                {isExpanded && (
                  <div className="p-3 space-y-3">
                    {nodes.map(node => (
                      <div key={node.code}>
                        {node.children ? (
                          /* 자식이 있는 중간 노드 */
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                              {node.label}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-1">
                              {node.children.map(child => (
                                <div key={child.code} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`cat-${child.code}`}
                                    checked={selectedCats.has(child.code)}
                                    onCheckedChange={() => toggleCat(child.code)}
                                  />
                                  <label htmlFor={`cat-${child.code}`} className="text-xs cursor-pointer leading-tight">
                                    {child.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* 리프 노드 */
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`cat-${node.code}`}
                              checked={selectedCats.has(node.code)}
                              onCheckedChange={() => toggleCat(node.code)}
                            />
                            <label htmlFor={`cat-${node.code}`} className="text-xs cursor-pointer">
                              {node.label}
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedCats.size > 0 && (
          <p className="text-xs text-muted-foreground">
            총 <span className="font-medium text-foreground">{selectedCats.size}</span>개 카테고리 선택됨
          </p>
        )}
      </section>

      <Separator />

      {/* 배송 가능 지역 */}
      <section className="space-y-3">
        <h2 className="font-semibold">{t('spf.regionSection')}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {REGIONS.map(({ value }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`reg-${value}`}
                checked={regions.includes(value)}
                onCheckedChange={() => setRegions(prev => prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value])}
              />
              <label htmlFor={`reg-${value}`} className="text-sm cursor-pointer">{t(`sregion.${value}`)}</label>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* 화학물질 취급허가증 */}
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            화학물질 취급허가증
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            REACH·화관법 규제물질 취급 허가증을 등록하면 해당 물질 입찰 시 신뢰도 배지가 표시됩니다.
          </p>
        </div>

        {permitUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary">취급허가증 등록됨</p>
              <a
                href={permitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground underline flex items-center gap-0.5 mt-0.5 truncate"
              >
                파일 보기 <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
            <button
              type="button"
              onClick={handlePermitRemove}
              className="rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => permitFileRef.current?.click()}
              disabled={permitUploading}
              className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground hover:border-secondary/50 hover:bg-secondary/5 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {permitUploading ? '업로드 중...' : '허가증 업로드 (PDF / 이미지 · 최대 5MB)'}
            </button>
            <input
              ref={permitFileRef}
              type="file"
              accept=".pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handlePermitUpload}
            />
            {permitError && <p className="mt-1 text-xs text-destructive">{permitError}</p>}
          </div>
        )}
      </section>

      <Separator />

      {/* 구독 현황 (읽기 전용) */}
      <section className="space-y-2">
        <h2 className="font-semibold">구독 현황</h2>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-muted p-4">
          <div>
            <div className="text-sm text-muted-foreground">현재 플랜</div>
            <div className="font-semibold capitalize">{profile?.plan ?? 'free'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">잔여 크레딧</div>
            <div className="font-semibold">{profile?.credits ?? 0}</div>
          </div>
          {profile?.early_bird && (
            <div className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              얼리버드
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? '저장 중...' : '저장'}
        </Button>
        {status === 'saved' && <span className="text-sm text-primary">저장되었습니다.</span>}
        {status === 'error' && <span className="text-sm text-destructive">{errorMsg}</span>}
      </div>
    </form>
  )
}
