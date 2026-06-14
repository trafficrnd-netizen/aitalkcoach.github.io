'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { updateSupplierProfile } from '@/lib/actions/supplier'
import { ITEM_TYPE_LABELS, ITEM_TYPE_ICONS, CATEGORY_TREE } from '@/lib/categories'
import { EQUIPMENT_SUB_TYPE_LABELS, type EquipmentSubType } from '@/lib/equipment-specs'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Upload, X, ExternalLink } from 'lucide-react'

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
  permit_url?: string | null
}

export function SupplierProfileForm({ profile }: { profile: SupplierProfile | null }) {
  const t = useT()
  const [categories, setCategories] = useState<string[]>(profile?.categories ?? [])
  const [proteinCats, setProteinCats] = useState<string[]>(profile?.protein_categories ?? [])
  const [equipCats, setEquipCats] = useState<string[]>(profile?.equipment_categories ?? [])
  const [regions, setRegions] = useState<string[]>(profile?.regions ?? [])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // 취급허가증 업로드
  const [permitUrl, setPermitUrl] = useState<string | null>(profile?.permit_url ?? null)
  const [permitUploading, setPermitUploading] = useState(false)
  const [permitError, setPermitError] = useState('')
  const permitFileRef = useRef<HTMLInputElement>(null)

  function toggle<T extends string>(arr: T[], val: T, setter: (a: T[]) => void) {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

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

      {/* 취급 대분류 */}
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">{t('spf.categorySection')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('spf.categorySub')}</p>
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
            <p className="text-xs font-semibold text-primary">{t('spf.proteinSub')}</p>
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
            <p className="text-xs font-semibold text-primary">{t('spf.equipSub')}</p>
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
        <h2 className="font-semibold">{t('spf.regionSection')}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {REGIONS.map(({ value }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`reg-${value}`}
                checked={regions.includes(value)}
                onCheckedChange={() => toggle(regions, value, setRegions)}
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
