'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'

export function MediLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || ''
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push(redirectTo || result.destination || '/clinic')
  }

  return (
    <div className="w-full max-w-sm">
      {/* 브랜드 헤더 */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-violet-400" />
          <span className="text-2xl font-black tracking-tight">
            BidVibe <span className="text-violet-400">Medi</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">에스테틱 소모품 비공개 역경매 플랫폼</p>
        <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
          프로모션 기간 전액무료
        </span>
      </div>

      {/* 로그인 카드 */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-bold mb-1">로그인</h1>
        <p className="text-sm text-muted-foreground mb-6">
          의원 또는 에스테틱 공급사 계정으로 로그인하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="이메일 주소"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </Button>
        </form>

        {/* 구분선 */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">계정이 없으신가요?</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* 가입 CTA — 의원 / 공급사 구분 */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/signup/clinic"
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-3 text-center text-xs hover:bg-muted transition-colors"
          >
            <span className="text-lg">🏥</span>
            <span className="font-semibold text-foreground">의원·피부관리실</span>
            <span className="text-muted-foreground">소모품 견적 요청</span>
          </Link>
          <Link
            href="/signup/medi-supplier"
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-3 text-center text-xs hover:bg-muted transition-colors"
          >
            <span className="text-lg">📦</span>
            <span className="font-semibold text-foreground">에스테틱 공급사</span>
            <span className="text-muted-foreground">입찰·납품 참여</span>
          </Link>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        일반 BidVibe 계정은{' '}
        <Link href="/login" className="underline hover:text-foreground">
          여기서 로그인
        </Link>
      </p>
    </div>
  )
}
