'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { createMediAd } from '@/lib/actions/medi-ad'

const AESTHETIC_PRODUCTS = [
  '레이저/HIFU 카트리지', 'RF/EMS 소모품', '모델링팩', '시트마스크',
  '앰플/세럼', '클렌징제품', '일회용 장갑', '일회용 해면',
  '베드커버', '일회용 베드시트', '타월', '가운',
  '괄사', 'MTS 니들', '주사기/캐뉼라', '초음파젤',
]

const MAX_DESC = 150

export default function NewMediAdPage() {
  const router = useRouter()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [desc, setDesc] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function toggleProduct(p: string) {
    setSelectedProducts(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('products', selectedProducts.join(','))
    startTransition(async () => {
      const result = await createMediAd(fd)
      if (result?.error) setError(result.error)
    })
  }

  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)

  return (
    <div className="max-w-lg">
      <Link href="/medi-supplier/board" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mb-5 gap-1' })}>
        <ArrowLeft className="h-4 w-4" /> 광고 목록으로
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">광고 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">광고 제목 <span className="text-destructive">*</span></Label>
          <Input id="title" name="title" placeholder="예: 레이저 카트리지 대량 공급 — 최저가 보장" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">
            소개글 <span className="text-muted-foreground font-normal">({desc.length}/{MAX_DESC}자)</span>
          </Label>
          <textarea
            id="description"
            name="description"
            value={desc}
            onChange={e => setDesc(e.target.value.slice(0, MAX_DESC))}
            rows={3}
            placeholder="취급 제품, 특장점, 배송 조건 등을 간략히 소개하세요."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label>취급 제품 태그 (복수 선택)</Label>
          <div className="flex flex-wrap gap-1.5">
            {AESTHETIC_PRODUCTS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => toggleProduct(p)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  selectedProducts.includes(p)
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactInfo">연락처 (전화/이메일)</Label>
          <Input id="contactInfo" name="contactInfo" placeholder="010-0000-0000 또는 info@company.com" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="imageUrl">대표 이미지 URL (선택)</Label>
          <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." />
          <p className="text-[11px] text-muted-foreground">이미지를 먼저 업로드하고 URL을 붙여넣으세요.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="validUntil">광고 만료일 <span className="text-destructive">*</span></Label>
          <Input
            id="validUntil"
            name="validUntil"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            max={maxDate.toISOString().split('T')[0]}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? '등록 중...' : '광고 등록하기'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
        </div>
      </form>
    </div>
  )
}
