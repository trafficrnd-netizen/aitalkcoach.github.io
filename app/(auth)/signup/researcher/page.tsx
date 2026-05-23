'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signupResearcher } from '@/lib/actions/auth'
import { isInstitutionalEmail, INSTITUTIONAL_EMAIL_ERROR } from '@/lib/email-validation'
import { PrivacyConsent } from '@/components/privacy-consent'
import { PhoneVerify } from '@/components/phone-verify'

export default function ResearcherSignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState({ terms: false, privacy: false, thirdParty: false, marketing: false })
  const [verifiedPhone, setVerifiedPhone] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!consent.terms || !consent.privacy) {
      setError('필수 약관에 모두 동의해주세요.')
      return
    }

    if (!verifiedPhone) {
      setError('휴대폰 본인인증을 완료해주세요.')
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const email = formData.get('email') as string
    if (!isInstitutionalEmail(email)) {
      setError(INSTITUTIONAL_EMAIL_ERROR)
      setLoading(false)
      return
    }

    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    formData.set('thirdPartyConsent', consent.thirdParty ? 'true' : 'false')
    formData.set('marketingConsent', consent.marketing ? 'true' : 'false')
    formData.set('phone', verifiedPhone)

    const result = await signupResearcher(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/researcher')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">연구자 베타 참여</h1>
        <p className="text-sm text-muted-foreground mb-1">무료로 견적 요청을 시작하세요</p>
        <p className="text-xs text-amber-600 mb-6">기업·기관·학교 이메일만 가입 가능합니다</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" placeholder="홍길동" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@institution.ac.kr"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">소속 기관</Label>
            <Input id="institution" name="institution" placeholder="○○대학교" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">부서 / 연구실</Label>
            <Input id="department" name="department" placeholder="화학과 / ○○연구실" />
          </div>

          <PhoneVerify onVerified={setVerifiedPhone} />

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>

          <PrivacyConsent values={consent} onChange={setConsent} role="researcher" />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '처리 중...' : '베타 참여 신청'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary hover:underline">
            로그인
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          공급자이신가요?{' '}
          <Link href="/signup/supplier" className="text-primary hover:underline">
            공급자 가입
          </Link>
        </p>
      </div>
    </div>
  )
}
