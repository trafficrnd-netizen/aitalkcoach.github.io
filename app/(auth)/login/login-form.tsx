'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'

export function LoginForm() {
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

    router.push(redirectTo || result.destination || '/researcher/board')
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">로그인</h1>
        <p className="text-sm text-muted-foreground mb-6">이메일과 비밀번호를 입력하세요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          계정이 없으신가요?{' '}
          <Link href="/signup/researcher" className="text-primary hover:underline">
            연구자 가입
          </Link>
          {' / '}
          <Link href="/signup/supplier" className="text-primary hover:underline">
            공급자 가입
          </Link>
        </p>
      </div>
    </div>
  )
}
