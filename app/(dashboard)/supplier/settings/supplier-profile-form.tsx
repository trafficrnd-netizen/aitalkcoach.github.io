'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { updateSupplierProfile } from '@/lib/actions/supplier'
import { ITEM_TYPE_LABELS, ITEM_TYPE_ICONS, CATEGORY_TREE } from '@/lib/categories'
import { EQUIPMENT_SUB_TYPE_LABELS, type EquipmentSubType } from '@/lib/equipment-specs'
import { cn } from '@/lib/utils'

const TOP_CATEGORIES = [
  { value: 'reagent', label: ITEM_TYPE_LABELS.reagent, icon: ITEM_TYPE_ICONS.reagent },
  { value: 'protein', label: ITEM_TYPE_LABELS.protein, icon: ITEM_TYPE_ICONS.protein },
  { value: 'supply', label: ITEM_TYPE_LABELS.supply, icon: ITEM_TYPE_ICONS.supply },
  { value: 'equipment', label: ITEM_TYPE_LABELS.equipment, icon: ITEM_TYPE_ICONS.equipment },
  { value: 'safety', label: '안전·보호구', icon: '🦺' },
  { value: 'other', label: '기타', icon: '📋' },
]

const PROTEIN_SUBCATS = CATEGORY_TREE.protein.map(n => ({ value: n.code, label: n.label }))
const EQUIP_SUBCATS = (Object.keys(EQUIPMENT_SUB_TYPE_LABELS) as EquipmentSubType[]).map(k => ({
  value: k,
  label: EQUIPMENT_SUB_TYPE_LABELS[k],
}))

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
}

export function SupplierProfileForm({ profile }: { profile: SupplierProfile | null }) {
  const [categories, setCategories] = useState<string[]>(profile?.categories ?? [])
  const [proteinCats, setProteinCats] = useState<string[]>(profile?.protein_categories ?? [])
  const [equipCats, setEquipCats] = useState<string[]>(profile?.equipment_categories ?? [])
  const [regions, setRegions] = useState<string[]>(profile?.regions ?? [])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function toggle<T extends string>(arr: T[], val: T, setter: (a: T[]) => void) {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const hasProtein = categories.includes('protein')
  const hasEquipment = categories.includes('equipment')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    categories.forEach(c => formData.append('categories', c))
    regions.forEach(r => formData.append('regions', r))
    proteinCats.forEach(c => formData.append('proteinCategories', c))
    equipCats.forEach(c => formData.append('equipmentCategories', c))

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
        <h2 className="font-semibold">기본 정보</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">회사명</Label>
            <Input id="companyName" name="companyName" defaultValue={profile?.company_name ?? ''} required />
          </div>
          <div className="space-y-2">
            <Label>사업자번호</Label>
            <Input
              value={profile?.business_number
                ? profile.business_number.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
                : ''}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="representative">대표자명</Label>
            <Input id="representative" name="representative" defaultValue={profile?.representative ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">대표 전화</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ''} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">사업장 주소</Label>
          <Input id="address" name="address" defaultValue={profile?.address ?? ''} />
        </div>
      </section>

      <Separator />

      {/* 취급 대분류 */}
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">취급 카테고리</h2>
          <p className="text-xs text-muted-foreground mt-0.5">취급하는 품목 유형을 선택하면 관련 요청을 받을 수 있습니다.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TOP_CATEGORIES.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggle(categories, value, setCategories)}
              className={cn(
                'flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-colors text-left',
                categories.includes(value)
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background text-foreground hover:border-muted-foreground'
              )}
            >
              <span className="text-base">{icon}</span>
              <span className="font-medium text-xs">{label}</span>
            </button>
          ))}
        </div>

        {/* 단백질 서브카테고리 */}
        {hasProtein && (
          <div className="rounded-lg border border-primary/20 bg-primary/3 p-4 space-y-2 ml-2">
            <p className="text-xs font-semibold text-primary">단백질·펩타이드 시약 세부 분류 (복수 선택)</p>
            <div className="grid grid-cols-2 gap-2">
              {PROTEIN_SUBCATS.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`pcat-${value}`}
                    checked={proteinCats.includes(value)}
                    onCheckedChange={() => toggle(proteinCats, value, setProteinCats)}
                  />
                  <label htmlFor={`pcat-${value}`} className="text-xs cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 장비 서브카테고리 */}
        {hasEquipment && (
          <div className="rounded-lg border border-primary/20 bg-primary/3 p-4 space-y-2 ml-2">
            <p className="text-xs font-semibold text-primary">장비·기기 세부 분류 (복수 선택)</p>
            <div className="grid grid-cols-2 gap-2">
              {EQUIP_SUBCATS.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`ecat-${value}`}
                    checked={equipCats.includes(value)}
                    onCheckedChange={() => toggle(equipCats, value, setEquipCats)}
                  />
                  <label htmlFor={`ecat-${value}`} className="text-xs cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* 배송 가능 지역 */}
      <section className="space-y-3">
        <h2 className="font-semibold">배송 가능 지역</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {REGIONS.map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`reg-${value}`}
                checked={regions.includes(value)}
                onCheckedChange={() => toggle(regions, value, setRegions)}
              />
              <label htmlFor={`reg-${value}`} className="text-sm cursor-pointer">{label}</label>
            </div>
          ))}
        </div>
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
