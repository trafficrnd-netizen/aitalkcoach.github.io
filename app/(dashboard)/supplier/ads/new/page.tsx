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

const CATEGORIES = [
  '화학·바이오 시약',
  '단백질·펩타이드 시약 (항체·재조합단백질·펩타이드)',
  '소모품·실험기구',
  '장비·기기',
  '안전용품',
  '기타',
]
const REGIONS = ['전국', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '기타 지방']

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
      setImageError(`이미지는 ${MAX_IMAGE_MB}MB 이하만 등록 가능합니다.`)
      e.target.value = ''
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('JPG, PNG, WEBP 형식만 허용됩니다.')
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
      setError('사용 가능한 광고 토큰이 없습니다.')
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
      if (!user) { setError('로그인이 필요합니다.'); setUploading(false); return }

      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('supplier-ads')
        .upload(path, imageFile, { contentType: imageFile.type, upsert: false })
      setUploading(false)

      if (uploadErr) {
        setError('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
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
          <ArrowLeft className="h-4 w-4 mr-1" /> 게시판
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-1">광고 등록</h1>
      <p className="text-sm text-muted-foreground mb-4">
        취급 품목과 연락처를 게시해 연구자에게 알리세요.
      </p>

      {/* 토큰 현황 */}
      {tokenInfo && (
        <div className={`rounded-lg border px-4 py-3 mb-6 text-sm ${noToken ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">
                사용 가능한 광고 토큰: <span className={`text-lg font-bold ${noToken ? 'text-destructive' : 'text-primary'}`}>{tokenInfo.available}개</span>
              </span>
            </div>
            {tokenInfo.isEarlybird && (
              <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-2 py-0.5">🎁 얼리버드</span>
            )}
          </div>
          {tokenInfo.isEarlybird && (
            <p className="text-xs text-muted-foreground mt-1.5">
              얼리버드 기간 중 매주 1개씩 자동 지급됩니다.
              {tokenInfo.nextTokenAt && (
                <> 다음 지급 예정: <strong>{new Date(tokenInfo.nextTokenAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</strong></>
              )}
            </p>
          )}
          {!tokenInfo.isEarlybird && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {tokenInfo.plan === 'free'
                ? 'Basic 또는 Pro 플랜 구독 시 광고 토큰이 지급됩니다.'
                : `이번 달 ${tokenInfo.monthlyAlloc}개 지급 (${tokenInfo.plan} 기본 + 평점 보너스 ${tokenInfo.ratingBonus ?? 0}개) · 사용 ${tokenInfo.usedThisMonth ?? 0}개`
              }
            </p>
          )}
          {noToken && tokenInfo.plan === 'free' && !tokenInfo.isEarlybird && (
            <Link href="/supplier/billing" className="mt-2 inline-block text-xs text-primary underline font-medium">플랜 업그레이드 →</Link>
          )}
        </div>
      )}

      {/* 배너 광고 안내 */}
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 mb-6 flex items-start gap-3">
        <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">배너 광고 (프리미엄)</span>는 별도 문의로 진행합니다.{' '}
          <a href="mailto:contact@ai-traffic.kr" className="text-primary underline font-medium">contact@ai-traffic.kr</a>
          로 연락주시면 맞춤 제안을 드립니다.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 제목 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            광고 제목 <span className="text-destructive">*</span>
          </label>
          <Input
            name="title"
            placeholder="예: 유기용매·일반화학시약 전문 공급 — 당일 출고 가능"
            required
            maxLength={80}
            disabled={loading}
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            광고 이미지 <span className="text-xs text-muted-foreground font-normal">(선택 · JPG/PNG/WEBP · 최대 {MAX_IMAGE_MB}MB)</span>
          </label>
          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              이미지 선택
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

        {/* 상세 설명 (150자 제한) */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">상세 설명</label>
          <textarea
            name="description"
            rows={3}
            value={desc}
            onChange={e => setDesc(e.target.value.slice(0, MAX_DESC))}
            placeholder="취급 브랜드, 강점, 최소 주문 수량, 특이사항 등"
            disabled={loading}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className={`text-xs mt-0.5 text-right ${desc.length >= MAX_DESC ? 'text-destructive' : 'text-muted-foreground'}`}>
            {desc.length} / {MAX_DESC}자
          </p>
        </div>

        {/* 카테고리 */}
        <div>
          <label className="text-sm font-medium mb-2 block">취급 카테고리</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => toggleCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCats.includes(c)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div>
          <label className="text-sm font-medium mb-2 block">납품 가능 지역</label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map(r => (
              <button key={r} type="button" onClick={() => toggleRegion(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedRegions.includes(r)
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-border bg-background text-muted-foreground hover:border-amber-400'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 연락처 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">연락처 (선택)</label>
          <Input name="contactInfo" placeholder="예: 02-1234-5678 또는 sales@company.kr" disabled={loading} />
          <p className="text-xs text-muted-foreground mt-1">게시판에 공개됩니다.</p>
        </div>

        {/* 만료일 */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            광고 만료일 <span className="text-destructive">*</span>
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
          <p className="text-xs text-muted-foreground mt-1">최대 90일까지 설정 가능합니다.</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading || !!noToken}>
            {uploading ? '이미지 업로드 중...' : isPending ? '등록 중...' : `광고 등록 (토큰 1개 소모)`}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            취소
          </Button>
        </div>
      </form>
    </div>
  )
}
