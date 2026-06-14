'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupplierAd } from '@/lib/actions/supplier-ad'
import { ArrowLeft, ImagePlus, X, Info, Mail } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/context'

const CATEGORIES = [
  '화학·바이오 시약',
  '단백질·펩타이드 시약 (항체·재조합단백질·펩타이드)',
  '소모품·실험기구',
  '장비·기기',
  '안전용품',
  '기타',
]
const REGIONS = [
  '전국',
  '서울특별시', '인천광역시', '경기도',
  '강원특별자치도',
  '충청북도', '충청남도', '대전광역시', '세종특별자치시',
  '전북특별자치도', '전라남도', '광주광역시',
  '경상북도', '경상남도', '대구광역시', '부산광역시', '울산광역시',
  '제주특별자치도',
]

const MAX_DESC = 150
const MAX_IMAGE_MB = 2
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024

type TokenInfo = {
  available: number
  isEarlybird: boolean
  plan: string
  nextTokenAt?: string
  monthlyAlloc?: number
  usedThisMonth?: number
  avgRating?: number
  ratingBonus?: number
}

export default function NewAdPage() {
  const t = useT()
  const router = useRouter()
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [desc, setDesc] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/supplier/ad-tokens')
      .then(r => r.json())
      .then(setTokenInfo)
      .catch(() => {})
  }, [])

  function toggleCat(c: string) {
    setSelectedCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  }
  function toggleRegion(r: string) {
    setSelectedRegions(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError('')
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t('ads.errImageSize').replace('{n}', String(MAX_IMAGE_MB)))
      e.target.value = ''
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError(t('ads.errImageFormat'))
      e.target.value = ''
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    setImageError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!tokenInfo || tokenInfo.available < 1) {
      setError(t('ads.errNoToken'))
      return
    }

    const fd = new FormData(e.currentTarget)
    fd.set('categories', selectedCats.join(','))
    fd.set('regions', selectedRegions.join(','))
    fd.set('description', desc)

    // Upload image if selected
    if (imageFile) {
      setUploading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError(t('ads.errLoginRequired')); setUploading(false); return }

      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('supplier-ads')
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false })
      setUploading(false)

      if (uploadErr) {
        setError(t('ads.errUploadFailed'))
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('supplier-ads').getPublicUrl(uploadData.path)
      fd.set('imageUrl', publicUrl)
    }

    startTransition(async () => {
      const result = await createSupplierAd(fd)
      if (result?.error) setError(result.error)
    })
  }

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 90)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const noToken = tokenInfo && tokenInfo.available < 1
  const loading = isPending || uploading

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/supplier/board" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('ads.back')}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-1">{t('ads.title')}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {t('ads.sub')}
      </p>

      {/* 토큰 현황 */}
      {tokenInfo && (
        <div className={`rounded-lg border px-4 py-3 mb-6 text-sm ${noToken ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">
                {t('ads.tokenAvail')} <span className={`text-lg font-bold ${noToken ? 'text-destructive' : 'text-primary'}`}>{tokenInfo.available}</span>
              </span>
            </div>
            {tokenInfo.isEarlybird && (
              <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-2 py-0.5">🎁 {t('ads.earlybird')}</span>
            )}
          </div>
          {tokenInfo.isEarlybird && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {t('ads.earlybirdNote')}
              {tokenInfo.nextTokenAt && (
                <> {t('ads.earlybirdNext')} <strong>{new Date(tokenInfo.nextTokenAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</strong></>
              )}
            </p>
          )}
          {!tokenInfo.isEarlybird && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {tokenInfo.plan === 'free'
                ? t('ads.planFreeNote')
                : `${tokenInfo.monthlyAlloc} (${tokenInfo.plan} + ${tokenInfo.ratingBonus ?? 0}) · ${tokenInfo.usedThisMonth ?? 0}`
              }
            </p>
          )}
          {noToken && tokenInfo.plan === 'free' && !tokenInfo.isEarlybird && (
            <Link href="/supplier/billing" className="mt-2 inline-block text-xs text-primary underline font-medium">{t('ads.upgradeLink')}</Link>
          )}
        </div>
      )}

      {/* 배너 광고 안내 */}
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 mb-6 flex items-start gap-3">
        <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{t('ads.bannerLabel')}</span>{t('ads.bannerDesc')}{' '}
          <a href="mailto:contact@ai-traffic.kr" className="text-primary underline font-medium">contact@ai-traffic.kr</a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 제목 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {t('ads.titleLabel')} <span className="text-destructive">*</span>
          </label>
          <Input
            name="title"
            placeholder={t('ads.titlePh')}
            required
            maxLength={80}
            disabled={loading}
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {t('ads.imageLabel')} <span className="text-xs text-muted-foreground font-normal">(JPG/PNG/WEBP · {MAX_IMAGE_MB}MB)</span>
          </label>
          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              {t('ads.imageSelectBtn')}
            </button>
          ) : (
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          {imageError && <p className="text-xs text-destructive mt-1">{imageError}</p>}
        </div>

        {/* 상세 설명 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('ads.descLabel')}</label>
          <textarea
            name="description"
            rows={3}
            value={desc}
            onChange={e => setDesc(e.target.value.slice(0, MAX_DESC))}
            placeholder={t('ads.descPh')}
            disabled={loading}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className={`text-xs mt-0.5 text-right ${desc.length >= MAX_DESC ? 'text-destructive' : 'text-muted-foreground'}`}>
            {desc.length} / {MAX_DESC}
          </p>
        </div>

        {/* 카테고리 */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t('ads.catLabel')}</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => toggleCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCats.includes(c)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}>
                {t(`adcat.${c}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t('ads.regionLabel')}</label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map(r => (
              <button key={r} type="button" onClick={() => toggleRegion(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedRegions.includes(r)
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-border bg-background text-muted-foreground hover:border-amber-400'
                }`}>
                {t(`region.${r}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 연락처 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('ads.contactLabel')}</label>
          <Input name="contactInfo" placeholder={t('ads.contactPh')} disabled={loading} />
          <p className="text-xs text-muted-foreground mt-1">{t('ads.contactNote')}</p>
        </div>

        {/* 만료일 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {t('ads.expLabel')} <span className="text-destructive">*</span>
          </label>
          <Input
            type="date"
            name="validUntil"
            min={tomorrow.toISOString().split('T')[0]}
            max={maxDate.toISOString().split('T')[0]}
            required
            className="max-w-xs"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">{t('ads.expNote')}</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading || !!noToken}>
            {uploading ? t('ads.uploadingBtn') : isPending ? t('ads.postingBtn') : t('ads.submitBtn')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            {t('ads.cancelBtn')}
          </Button>
        </div>
      </form>
    </div>
  )
}
